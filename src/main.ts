import './tracing/tracing.bootstrap';
import * as Sentry from '@sentry/nestjs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { JsonLoggerService } from './common/logger/json-logger.service';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';
import { StringLengthValidationPipe } from './common/pipes/string-length-validation.pipe';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import {
  DEFAULT_JSON_BODY_LIMIT,
  DEFAULT_WEBHOOK_BODY_LIMIT,
  buildCorsOptions,
  buildCspConnectSrc,
  isPayloadTooLargeError,
  parseCommaSeparatedOrigins,
} from './common/security/http-security.config';

type RawBodyRequest = Request & { rawBody?: Buffer };
type BodyParserError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
  limit?: number;
  length?: number;
};

function storeRawBody(req: RawBodyRequest, _res: Response, buffer: Buffer): void {
  req.rawBody = Buffer.from(buffer);
}

function defaultHorizonForNetwork(network: 'TESTNET' | 'MAINNET'): string {
  return network === 'MAINNET'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
}

function defaultSorobanRpcForNetwork(network: 'TESTNET' | 'MAINNET'): string {
  return network === 'MAINNET'
    ? 'https://mainnet.sorobanrpc.com'
    : 'https://soroban-testnet.stellar.org';
}

async function bootstrap() {
  // ── Sentry – must init before NestFactory so instrumentation wraps all modules
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      release: process.env.GIT_SHA,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    });
  }

  // Bootstrap with a temporary console logger so early errors are visible,
  // then swap to the structured JSON logger once the DI container is ready.
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  // ── Structured JSON logger (issue #81) ────────────────────────────────────
  const jsonLogger = app.get(JsonLoggerService);
  app.useLogger(jsonLogger);

  const configService = app.get(ConfigService);
  const stellarNetwork = configService.get('STELLAR_NETWORK');
  const webhookBodyLimit = process.env.WEBHOOK_BODY_LIMIT || DEFAULT_WEBHOOK_BODY_LIMIT;
  const jsonBodyLimit = process.env.JSON_BODY_LIMIT || DEFAULT_JSON_BODY_LIMIT;

  // ── JSON body limits and webhook raw body capture (issue #327) ─────────────
  // Webhook payloads are capped before controllers run. Oversized payloads are
  // converted to a clear 413 response and logged below for abuse monitoring.
  app.use(
    '/webhooks/stellar',
    express.json({
      limit: webhookBodyLimit,
      verify: storeRawBody,
    }),
  );
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));
  app.use(
    (
      error: BodyParserError,
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      if (!isPayloadTooLargeError(error)) {
        next(error);
        return;
      }

      jsonLogger.structured(
        'warn',
        'request.payload_too_large',
        {
          method: req.method,
          path: req.originalUrl,
          contentLength: req.headers['content-length'] ?? null,
          limit: error.limit ?? webhookBodyLimit,
        },
        'RequestSizeLimit',
      );

      res.status(413).json({
        statusCode: 413,
        message: 'Payload too large',
        error: 'Payload Too Large',
      });
    },
  );

  // ── HTTP security headers (issue #84 / #325) ──────────────────────────────
  // CSP connect-src only includes self, the configured Stellar Horizon/RPC
  // origins, Sentry/OTEL origins if configured, and explicit development extras.
  const cspConnectSrc = buildCspConnectSrc({
    stellarHorizonUrl:
      process.env.STELLAR_HORIZON_URL || defaultHorizonForNetwork(stellarNetwork),
    sorobanRpcUrl:
      process.env.SOROBAN_RPC_URL || defaultSorobanRpcForNetwork(stellarNetwork),
    sentryDsn,
    otelExporterOtlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    extraConnectSrc: parseCommaSeparatedOrigins(process.env.CSP_CONNECT_SRC_EXTRA),
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: cspConnectSrc,
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      // This service is a JSON API consumed by separate frontend origins.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ── CORS – restrict to known frontend origins (issue #85 / #328) ──────────
  const allowedOrigins = configService.getAllowedOrigins();
  app.enableCors(
    buildCorsOptions({
      allowedOrigins,
      isProduction: configService.isProduction(),
    }),
  );

  // ── Gzip compression (issue #106) ─────────────────────────────────────────
  // Applied before routing so every JSON response is compressed. The threshold
  // (1 KB) avoids the overhead for tiny payloads that wouldn't benefit.
  app.use(compression({ threshold: 1024 }));

  // ── Sentry global interceptor (issue #28) ─────────────────────────────────
  if (sentryDsn) {
    app.useGlobalInterceptors(new SentryInterceptor());
  }

  // ── Validation + sanitization pipes (issue #83 / #326) ────────────────────
  // ValidationPipe rejects malformed objects before they reach handlers. The
  // string-length pipe enforces global storage/memory safety limits, then
  // SanitizationPipe strips dangerous characters from every string field.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
    new StringLengthValidationPipe(),
    new SanitizationPipe(),
  );

  // ── Swagger / OpenAPI docs (issue #47) ────────────────────────────────────
  // DTOs are annotated with @ApiProperty so the generated schema shows
  // descriptions and realistic examples for every request/response body.
  // Served at GET /api/docs (JSON at /api/docs-json).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TrustLink API')
    .setDescription(
      'REST API for the TrustLink escrow backend. Auto-generated from DTO decorators.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  app.enableShutdownHooks();

  const port = configService.get('PORT');
  await app.listen(port);

  jsonLogger.log(
    JSON.stringify({
      msg: 'server.started',
      port,
      env: configService.get('NODE_ENV'),
      network: configService.get('STELLAR_NETWORK'),
      allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : 'all',
      cspConnectSrc,
      jsonBodyLimit,
      webhookBodyLimit,
    }),
    'Bootstrap',
  );
}

void bootstrap();

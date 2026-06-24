import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import request from 'supertest';
import {
  buildCorsOptions,
  buildCspConnectSrc,
  isPayloadTooLargeError,
} from '../../src/common/security/http-security.config';

describe('HTTP security hardening integration', () => {
  it('returns 413 and logs oversized webhook payload attempts', async () => {
    const oversizedAttempts: Array<Record<string, unknown>> = [];
    const app = express();

    app.use('/webhooks/stellar', express.json({ limit: '64b' }));
    app.use(
      (
        error: unknown,
        req: Request,
        res: Response,
        next: NextFunction,
      ) => {
        if (!isPayloadTooLargeError(error)) {
          next(error);
          return;
        }

        oversizedAttempts.push({
          method: req.method,
          path: req.originalUrl,
          contentLength: req.headers['content-length'],
        });

        res.status(413).json({
          statusCode: 413,
          message: 'Payload too large',
          error: 'Payload Too Large',
        });
      },
    );
    app.post('/webhooks/stellar', (_req, res) => res.json({ received: true }));

    const response = await request(app)
      .post('/webhooks/stellar')
      .send({ data: 'x'.repeat(1024) })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(413);
    expect(response.body).toEqual(
      expect.objectContaining({ error: 'Payload Too Large' }),
    );
    expect(oversizedAttempts).toHaveLength(1);
    expect(oversizedAttempts[0]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: '/webhooks/stellar',
      }),
    );
  });

  it('sets CORS headers only for configured production origins', async () => {
    const app = express();
    const corsOptions = buildCorsOptions({
      allowedOrigins: ['https://app.trustlink.example'],
      isProduction: true,
    });
    const originResolver = corsOptions.origin as (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void;

    app.use((req, res, next) => {
      const origin = req.headers.origin;
      originResolver(typeof origin === 'string' ? origin : undefined, (error, allow) => {
        if (!error && allow && typeof origin === 'string') {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Vary', 'Origin');
        }
        next();
      });
    });
    app.get('/health', (_req, res) => res.json({ ok: true }));

    await request(app)
      .get('/health')
      .set('Origin', 'https://app.trustlink.example')
      .expect('Access-Control-Allow-Origin', 'https://app.trustlink.example');

    const unauthorized = await request(app)
      .get('/health')
      .set('Origin', 'https://evil.example');

    expect(unauthorized.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('blocks all configured CORS origins when production ALLOWED_ORIGINS is empty', () => {
    const corsOptions = buildCorsOptions({
      allowedOrigins: [],
      isProduction: true,
    });

    expect(corsOptions.origin).toBe(false);
  });

  it('allows all CORS origins when development ALLOWED_ORIGINS is empty', () => {
    const corsOptions = buildCorsOptions({
      allowedOrigins: [],
      isProduction: false,
    });

    expect(corsOptions.origin).toBe(true);
  });

  it('builds CSP connect-src from configured service origins only', async () => {
    const connectSrc = buildCspConnectSrc({
      stellarHorizonUrl: 'https://horizon-testnet.stellar.org',
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org/rpc',
      sentryDsn: 'https://abc123@o123.ingest.sentry.io/456',
      extraConnectSrc: ['https://logistics.example'],
    });
    const app = express();

    app.use(
      helmet({
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            connectSrc,
          },
        },
      }),
    );
    app.get('/health', (_req, res) => res.json({ ok: true }));

    const response = await request(app).get('/health');
    const csp = response.headers['content-security-policy'];

    expect(csp).toContain("connect-src 'self' https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org https://o123.ingest.sentry.io https://logistics.example");
    expect(csp).not.toContain('*.stellar.org');
    expect(csp).not.toContain('https://evil.example');
  });
});

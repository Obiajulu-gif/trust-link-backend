export const DEFAULT_JSON_BODY_LIMIT = '1mb';
export const DEFAULT_WEBHOOK_BODY_LIMIT = '1mb';

export interface BuildCorsOptionsInput {
  allowedOrigins: string[];
  isProduction: boolean;
}

export interface BuildCspConnectSrcInput {
  stellarHorizonUrl?: string;
  sorobanRpcUrl?: string;
  sentryDsn?: string;
  otelExporterOtlpEndpoint?: string;
  extraConnectSrc?: string[];
}

type CorsOriginResolver = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => void;

export interface TrustLinkCorsOptions {
  origin: boolean | CorsOriginResolver;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function normalizeOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export function parseCommaSeparatedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function buildCorsOptions(input: BuildCorsOptionsInput): TrustLinkCorsOptions {
  const { allowedOrigins, isProduction } = input;

  if (allowedOrigins.length === 0) {
    return {
      origin: isProduction ? false : true,
      credentials: true,
    };
  }

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow same-origin/server-to-server requests that do not include Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    credentials: true,
    maxAge: 86400,
  };
}

export function buildCspConnectSrc(input: BuildCspConnectSrcInput): string[] {
  const origins = new Set<string>(["'self'"]);

  const addOrigin = (value: string | undefined) => {
    const origin = normalizeOrigin(value);
    if (origin) origins.add(origin);
  };

  addOrigin(input.stellarHorizonUrl);
  addOrigin(input.sorobanRpcUrl);
  addOrigin(input.sentryDsn);
  addOrigin(input.otelExporterOtlpEndpoint);

  for (const extraOrigin of input.extraConnectSrc ?? []) {
    addOrigin(extraOrigin);
  }

  return [...origins];
}

export function isPayloadTooLargeError(error: unknown): boolean {
  const candidate = error as { status?: number; statusCode?: number; type?: string };
  return (
    candidate?.status === 413 ||
    candidate?.statusCode === 413 ||
    candidate?.type === 'entity.too.large'
  );
}

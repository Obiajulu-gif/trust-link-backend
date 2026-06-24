import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export type AppEnv = 'development' | 'production' | 'test';

export function buildCorsOptions(allowedOrigins: string[], env: AppEnv): CorsOptions {
  const base: CorsOptions = {
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

  if (allowedOrigins.length === 0) {
    return {
      ...base,
      origin: env === 'production' ? false : true,
    };
  }

  return {
    ...base,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
  };
}

import express, { NextFunction, Request, Response } from 'express';
import type { JsonLoggerService } from '../logger/json-logger.service';

export const DEFAULT_WEBHOOK_BODY_LIMIT = '1mb';

export function webhookJsonParser(limit = DEFAULT_WEBHOOK_BODY_LIMIT) {
  return express.json({
    limit,
    verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  });
}

export function oversizedPayloadLogger(logger: JsonLoggerService) {
  return (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (isPayloadTooLarge(err)) {
      logger.warn(
        JSON.stringify({
          msg: 'webhook_payload_too_large',
          path: req.path,
          method: req.method,
          limit: DEFAULT_WEBHOOK_BODY_LIMIT,
        }),
        'WebhookBodyLimit',
      );
      res.status(413).json({ statusCode: 413, message: 'Payload Too Large' });
      return;
    }

    next(err);
  };
}

export function isPayloadTooLarge(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.too.large'
  );
}

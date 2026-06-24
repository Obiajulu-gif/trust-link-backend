import express from 'express';
import request from 'supertest';
import { oversizedPayloadLogger, webhookJsonParser } from './webhook-body-limit';

describe('webhookJsonParser integration', () => {
  it('returns 413 for oversized webhook payloads', async () => {
    const app = express();
    const logger = { warn: jest.fn() } as any;

    app.post('/webhooks/stellar', webhookJsonParser('10b'), (_req, res) => {
      res.json({ ok: true });
    });
    app.use(oversizedPayloadLogger(logger));

    await request(app)
      .post('/webhooks/stellar')
      .set('content-type', 'application/json')
      .send({ data: 'x'.repeat(100) })
      .expect(413);

    expect(logger.warn).toHaveBeenCalled();
  });
});

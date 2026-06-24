import express from 'express';
import request from 'supertest';
import { buildCorsOptions } from './cors.config';

describe('CORS options integration', () => {
  it('omits allow-origin header for unauthorized production origins', async () => {
    const app = express();
    app.use((_req, res) => res.json({ ok: true }));
    app.use((req, res, next) => next());
    app.use(require('cors')(buildCorsOptions(['https://app.example'], 'production')));

    const response = await request(app)
      .get('/')
      .set('Origin', 'https://not-configured.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

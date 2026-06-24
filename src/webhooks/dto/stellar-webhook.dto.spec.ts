import { validate } from 'class-validator';
import { StellarWebhookDto } from './stellar-webhook.dto';

describe('StellarWebhookDto max length validation', () => {
  it('rejects overlong string fields', async () => {
    const dto = Object.assign(new StellarWebhookDto(), {
      type: 'x'.repeat(65),
      id: 'id-1',
      transaction_hash: 'hash-1',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'type')).toBe(true);
  });
});

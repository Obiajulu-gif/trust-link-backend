import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StellarWebhookDto } from './stellar-webhook.dto';

describe('StellarWebhookDto length validation', () => {
  it('rejects oversized webhook string fields', async () => {
    const dto = plainToInstance(StellarWebhookDto, {
      type: 'payment',
      id: 'evt_1',
      transaction_hash: 'a'.repeat(129),
      amount: '1.0000000',
      asset_code: 'USDC',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'transaction_hash')).toBe(true);
  });

  it('accepts fields within safe limits', async () => {
    const dto = plainToInstance(StellarWebhookDto, {
      type: 'payment',
      id: '0123456789012345',
      transaction_hash: '3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889',
      to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      from: 'GA7QYNF7SOWQ3GLR2BGMZEHHO2LMTW5WD3KZRNQ4HBQAVPYM3VOI5JYM',
      amount: '250.0000000',
      asset_code: 'USDC',
      meta: { ledger: 51234567 },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});

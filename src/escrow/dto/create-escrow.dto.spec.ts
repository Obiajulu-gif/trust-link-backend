import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEscrowDto } from './create-escrow.dto';

describe('CreateEscrowDto length validation', () => {
  const validBuyer = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  it('rejects overly long item references', async () => {
    const dto = plainToInstance(CreateEscrowDto, {
      itemName: 'Sony Camera',
      itemRef: 'S'.repeat(256),
      amount: 100,
      currency: 'USDC',
      buyerAddress: validBuyer,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'itemRef')).toBe(true);
  });

  it('rejects overly long buyer addresses before persistence', async () => {
    const dto = plainToInstance(CreateEscrowDto, {
      itemName: 'Sony Camera',
      itemRef: 'SKU-123',
      amount: 100,
      currency: 'USDC',
      buyerAddress: `G${'A'.repeat(128)}`,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'buyerAddress')).toBe(true);
  });
});

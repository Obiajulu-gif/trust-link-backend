import { validate } from 'class-validator';
import { CreateEscrowDto } from './create-escrow.dto';

describe('CreateEscrowDto max length validation', () => {
  it('rejects overlong item references', async () => {
    const dto = Object.assign(new CreateEscrowDto(), {
      itemName: 'Camera',
      itemRef: 'x'.repeat(256),
      amount: 10,
      currency: 'USDC',
      buyerAddress: 'not-a-valid-address',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'itemRef')).toBe(true);
  });
});

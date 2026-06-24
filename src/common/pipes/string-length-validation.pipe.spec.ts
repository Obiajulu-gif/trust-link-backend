import { BadRequestException } from '@nestjs/common';
import { StringLengthValidationPipe } from './string-length-validation.pipe';

describe('StringLengthValidationPipe', () => {
  const pipe = new StringLengthValidationPipe();

  it('allows strings within configured field limits', () => {
    const payload = {
      itemName: 'Camera',
      callbackUrl: 'https://example.com/webhook',
      meta: {
        description: 'Safe description',
      },
    };

    expect(pipe.transform(payload)).toBe(payload);
  });

  it('rejects overly long name fields with a descriptive 400 error', () => {
    expect(() => pipe.transform({ itemName: 'a'.repeat(256) })).toThrow(
      BadRequestException,
    );

    try {
      pipe.transform({ itemName: 'a'.repeat(256) });
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({
          message: 'body.itemName must not exceed 255 characters',
        }),
      );
    }
  });

  it('recursively validates nested arrays and objects', () => {
    expect(() =>
      pipe.transform({
        items: [{ description: 'x'.repeat(501) }],
      }),
    ).toThrow(BadRequestException);
  });

  it('allows larger signed transaction fields while still enforcing a cap', () => {
    expect(
      pipe.transform({ transaction: 'A'.repeat(8192) }),
    ).toEqual({ transaction: 'A'.repeat(8192) });

    expect(() => pipe.transform({ transaction: 'A'.repeat(8193) })).toThrow(
      BadRequestException,
    );
  });
});

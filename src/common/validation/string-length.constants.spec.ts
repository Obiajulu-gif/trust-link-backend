import { STRING_LENGTH_LIMITS } from './string-length.constants';

describe('STRING_LENGTH_LIMITS', () => {
  it('keeps expected defensive limits', () => {
    expect(STRING_LENGTH_LIMITS.reference).toBe(255);
    expect(STRING_LENGTH_LIMITS.description).toBe(500);
    expect(STRING_LENGTH_LIMITS.url).toBe(2048);
  });
});

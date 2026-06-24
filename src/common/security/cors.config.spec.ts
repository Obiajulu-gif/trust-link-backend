import { buildCorsOptions } from './cors.config';

describe('buildCorsOptions', () => {
  it('blocks every cross-origin request in production when no origins are configured', () => {
    expect(buildCorsOptions([], 'production').origin).toBe(false);
  });

  it('allows every origin in development when no origins are configured', () => {
    expect(buildCorsOptions([], 'development').origin).toBe(true);
  });

  it('allows configured origins', () => {
    const origin = buildCorsOptions(['https://app.trustlink.example'], 'production').origin as Function;
    const callback = jest.fn();

    origin('https://app.trustlink.example', callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('blocks origins that are not configured', () => {
    const origin = buildCorsOptions(['https://app.trustlink.example'], 'production').origin as Function;
    const callback = jest.fn();

    origin('https://other.example', callback);

    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});

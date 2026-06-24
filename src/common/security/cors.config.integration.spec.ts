import { buildCorsOptions } from './cors.config';

describe('CORS options integration semantics', () => {
  it('production with empty allowed origins blocks browser origins', () => {
    expect(buildCorsOptions([], 'production').origin).toBe(false);
  });

  it('development with empty allowed origins allows browser origins', () => {
    expect(buildCorsOptions([], 'development').origin).toBe(true);
  });
});

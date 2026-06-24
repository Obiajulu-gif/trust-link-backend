import { DEFAULT_WEBHOOK_BODY_LIMIT, isPayloadTooLarge } from './webhook-body-limit';

describe('webhook body limit helpers', () => {
  it('uses a 1mb default webhook body limit', () => {
    expect(DEFAULT_WEBHOOK_BODY_LIMIT).toBe('1mb');
  });

  it('detects body parser payload-too-large errors', () => {
    expect(isPayloadTooLarge({ type: 'entity.too.large' })).toBe(true);
    expect(isPayloadTooLarge({ type: 'entity.parse.failed' })).toBe(false);
    expect(isPayloadTooLarge(null)).toBe(false);
  });
});

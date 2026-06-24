import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

export const DEFAULT_MAX_STRING_LENGTH = 2048;

const FIELD_LENGTH_LIMITS: Array<[RegExp, number]> = [
  [/name$/i, 255],
  [/title$/i, 255],
  [/status$/i, 64],
  [/type$/i, 64],
  [/currency$/i, 12],
  [/asset_?code$/i, 32],
  [/amount$/i, 64],
  [/url$/i, 2048],
  [/uri$/i, 2048],
  [/description$/i, 500],
  [/message$/i, 1000],
  [/transaction$/i, 8192],
  [/token$/i, 4096],
  [/secret$/i, 4096],
  [/signature$/i, 2048],
  [/hash$/i, 128],
  [/address$/i, 128],
  [/publicKey$/i, 128],
  [/id$/i, 255],
  [/ref$/i, 255],
];

function limitForField(path: string): number {
  const fieldName = path.split('.').pop() ?? path;
  const match = FIELD_LENGTH_LIMITS.find(([pattern]) => pattern.test(fieldName));
  return match?.[1] ?? DEFAULT_MAX_STRING_LENGTH;
}

function assertStringLengths(value: unknown, path = 'body', seen = new WeakSet<object>()) {
  if (typeof value === 'string') {
    const max = limitForField(path);
    if (value.length > max) {
      throw new BadRequestException(
        `${path} must not exceed ${max} characters`,
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertStringLengths(item, `${path}[${index}]`, seen));
    return;
  }

  if (value !== null && typeof value === 'object') {
    if (seen.has(value)) return;
    seen.add(value);

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      assertStringLengths(nestedValue, `${path}.${key}`, seen);
    }
  }
}

/**
 * Global defense-in-depth string length validation for DTOs and nested payloads.
 * DTO decorators still define field-level business rules; this pipe ensures no
 * route accidentally accepts unbounded strings that could pressure storage or
 * memory.
 */
@Injectable()
export class StringLengthValidationPipe implements PipeTransform {
  transform(value: unknown): unknown {
    assertStringLengths(value);
    return value;
  }
}

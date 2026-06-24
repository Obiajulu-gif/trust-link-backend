import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Issue #76 – Stellar Horizon webhook payload shape.
 *
 * Horizon sends a signed POST with a JSON body describing a ledger event.
 * We only mandate the fields we act on; everything else is captured in `meta`.
 */
export class StellarWebhookDto {
  @ApiProperty({
    description: 'Type of ledger event reported by Horizon.',
    example: 'payment',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  type: string;

  @ApiProperty({
    description: 'Unique identifier of the Horizon operation/event.',
    example: '0123456789012345',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  id: string;

  @ApiProperty({
    description: 'Hash of the Stellar transaction the event belongs to.',
    example: '3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889',
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  transaction_hash: string;

  @ApiPropertyOptional({
    description: 'Destination account of the payment, if applicable.',
    example: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    maxLength: 128,
  })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  to?: string;

  @ApiPropertyOptional({
    description: 'Source account of the payment, if applicable.',
    example: 'GA7QYNF7SOWQ3GLR2BGMZEHHO2LMTW5WD3KZRNQ4HBQAVPYM3VOI5JYM',
    maxLength: 128,
  })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  from?: string;

  @ApiPropertyOptional({
    description: 'Payment amount as a stringified decimal.',
    example: '250.0000000',
    maxLength: 64,
  })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  amount?: string;

  @ApiPropertyOptional({
    description: 'Asset code of the payment (omitted for native XLM).',
    example: 'USDC',
    maxLength: 32,
  })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  asset_code?: string;

  @ApiPropertyOptional({
    description: 'Any additional event fields Horizon includes, captured verbatim.',
    type: 'object',
    additionalProperties: true,
    example: { ledger: 51234567, paging_token: '220267715074457601' },
  })
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;
}

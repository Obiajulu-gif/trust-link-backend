import { IsString, IsNotEmpty, IsOptional, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StellarWebhookDto {
  @ApiProperty({ description: 'Type of ledger event reported by Horizon.', example: 'payment', maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  type: string;

  @ApiProperty({ description: 'Unique identifier of the Horizon operation/event.', example: '0123456789012345', maxLength: 128 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  id: string;

  @ApiProperty({ description: 'Hash of the Stellar transaction the event belongs to.', example: 'transaction-hash', maxLength: 128 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  transaction_hash: string;

  @ApiPropertyOptional({ description: 'Destination account of the payment, if applicable.', example: 'G...', maxLength: 128 })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  to?: string;

  @ApiPropertyOptional({ description: 'Source account of the payment, if applicable.', example: 'G...', maxLength: 128 })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  from?: string;

  @ApiPropertyOptional({ description: 'Payment amount as a stringified decimal.', example: '250.0000000', maxLength: 64 })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  amount?: string;

  @ApiPropertyOptional({ description: 'Asset code of the payment.', example: 'USDC', maxLength: 32 })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  asset_code?: string;

  @ApiPropertyOptional({ description: 'Any additional event fields Horizon includes.', type: 'object', additionalProperties: true })
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;
}

import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuoteItemDto {
  @IsString() description: string;
  @IsNumber() @Min(0) quantity: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) unitCost?: number;
}

export class CreateQuoteDto {
  @IsString() clientId: string;

  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}

export class UpdateQuoteDto {
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items?: QuoteItemDto[];
}

export class ChangeQuoteStatusDto {
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export class ApproveAndConvertDto {
  @IsOptional() @IsIn(['CASH', 'INSTALLMENTS', 'ON_DELIVERY']) paymentTerms?: 'CASH' | 'INSTALLMENTS' | 'ON_DELIVERY';
  @IsOptional() @IsNumber() @Min(1) installments?: number;
  @IsOptional() @IsDateString() firstDueDate?: string;
}

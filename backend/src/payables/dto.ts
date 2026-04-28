import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePayableDto {
  @IsString() description: string;
  @IsString() category: string;
  @IsOptional() @IsString() account?: string;
  @IsDateString() dueDate: string;
  @IsNumber() @Min(0) expectedAmount: number;
  @IsOptional() @IsBoolean() recurring?: boolean;
  @IsOptional() @IsIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
  recurringFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  @IsOptional() @IsString() notes?: string;
}

export class UpdatePayableDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() account?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsNumber() expectedAmount?: number;
  @IsOptional() @IsBoolean() recurring?: boolean;
  @IsOptional() @IsIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
  recurringFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  @IsOptional() @IsString() notes?: string;
}

export class PayPayableDto {
  @IsNumber() @Min(0) paidAmount: number;
  @IsOptional() @IsDateString() paidAt?: string;
  @IsIn(['CASH', 'BANK_TRANSFER', 'PIX', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO'])
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'PIX' | 'CHECK' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO';
  @IsOptional() @IsString() notes?: string;
}

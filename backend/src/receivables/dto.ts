import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PayReceivableDto {
  @IsNumber() @Min(0) paidAmount: number;
  @IsOptional() @IsDateString() paidAt?: string;
  @IsIn(['CASH', 'BANK_TRANSFER', 'PIX', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO'])
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'PIX' | 'CHECK' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO';
  @IsOptional() @IsString() bank?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateReceivableDto {
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsNumber() expectedAmount?: number;
  @IsOptional() @IsString() notes?: string;
}

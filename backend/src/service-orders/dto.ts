import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOSDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() responsibleId?: string;
  @IsOptional() @IsString() productionNotes?: string;
}

export class ChangeOSStatusDto {
  @IsIn(['WAITING_APPROVAL', 'WAITING_PRODUCTION', 'IN_PRODUCTION', 'FINISHED', 'CANCELED'])
  status: 'WAITING_APPROVAL' | 'WAITING_PRODUCTION' | 'IN_PRODUCTION' | 'FINISHED' | 'CANCELED';
}

export class CreateOSDto {
  @IsString() clientId: string;
  @IsString() description: string;
  @IsNumber() @Min(0) totalValue: number;
  @IsOptional() @IsNumber() @Min(0) totalCost?: number;
  @IsOptional() @IsIn(['CASH', 'INSTALLMENTS', 'ON_DELIVERY']) paymentTerms?: 'CASH' | 'INSTALLMENTS' | 'ON_DELIVERY';
  @IsOptional() @IsNumber() @Min(1) installments?: number;
  @IsOptional() @IsDateString() firstDueDate?: string;
  @IsOptional() @IsString() responsibleId?: string;
}

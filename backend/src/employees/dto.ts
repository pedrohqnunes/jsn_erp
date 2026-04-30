import { IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateEmployeeDto {
  @IsString() name: string;
  @IsString() role: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  @IsOptional() @IsNumber() salary?: number;
  @IsOptional() @IsInt() @Min(1) @Max(28) salaryPayDay?: number;
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  @IsOptional() @IsNumber() salary?: number;
  @IsOptional() @IsInt() @Min(1) @Max(28) salaryPayDay?: number;
}

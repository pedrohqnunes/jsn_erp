import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsOptional()
  @IsIn(['PF', 'PJ'])
  type?: 'PF' | 'PJ';

  @IsString()
  name: string;

  @IsOptional() @IsString() document?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateClientDto extends CreateClientDto {
  @IsOptional() name: string;
}

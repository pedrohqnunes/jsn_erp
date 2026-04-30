import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsIn(['ADMIN', 'USER']) role?: 'ADMIN' | 'USER';
}

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsIn(['ADMIN', 'USER']) role?: 'ADMIN' | 'USER';
  @IsOptional() @IsBoolean() active?: boolean;
}

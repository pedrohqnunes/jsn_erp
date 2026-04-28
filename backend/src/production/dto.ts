import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStageDto {
  @IsOptional() @IsIn(['PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED'])
  status?: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';

  @IsOptional() @IsString() responsibleId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateStageDto {
  @IsString() serviceOrderId: string;
  @IsString() name: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
  @IsOptional() @IsString() responsibleId?: string;
}

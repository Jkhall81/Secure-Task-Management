import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @Length(3, 100)
  title?: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

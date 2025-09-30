import { IsString, IsOptional, Length } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @Length(3, 100)
  title: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @IsString()
  @IsOptional()
  status?: string; // could later be restricted to enum values
}

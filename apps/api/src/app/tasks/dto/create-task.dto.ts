import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Finish NestJS Swagger integration',
    description: 'The title of the task',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100)
  title: string;

  @ApiPropertyOptional({
    example: 'Set up Swagger decorators on all controllers and DTOs',
    description: 'Detailed description of the task',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({
    example: 'in-progress',
    description: 'The status of the task (e.g., todo, in-progress, done)',
  })
  @IsString()
  @IsOptional()
  status?: string; // could later be restricted to enum values
}

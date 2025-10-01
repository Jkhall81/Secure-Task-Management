import {
  IsString,
  IsOptional,
  Length,
  IsNumber,
  IsInt,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  OTHER = 'other',
}

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
  status?: string;

  @ApiPropertyOptional({
    example: 'work',
    description: 'The category of the task',
    enum: TaskCategory,
    default: TaskCategory.WORK,
  })
  @IsEnum(TaskCategory)
  @IsOptional()
  category?: TaskCategory;

  @ApiPropertyOptional({
    example: 2,
    description: 'The organization ID where the task should be created',
  })
  @IsNumber()
  @IsInt()
  @IsOptional()
  organizationId?: number;
}

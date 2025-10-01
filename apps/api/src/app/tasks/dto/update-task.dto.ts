import { IsString, IsOptional, Length, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskCategory } from './create-task.dto';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Fix login bug',
    description: 'Short title of the task',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @Length(3, 100)
  title?: string;

  @ApiPropertyOptional({
    example: 'Resolve the 500 error when logging in with Google.',
    description: 'Detailed description of the task',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({
    example: 'in-progress',
    description:
      'Current status of the task (could be todo, in-progress, done)',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'work',
    description: 'Category of the task',
    enum: TaskCategory,
  })
  @IsEnum(TaskCategory)
  @IsOptional()
  category?: TaskCategory;
}

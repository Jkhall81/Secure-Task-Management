import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TaskIdParamDto {
  @ApiProperty({
    example: 42,
    description: 'The unique identifier of the task',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}

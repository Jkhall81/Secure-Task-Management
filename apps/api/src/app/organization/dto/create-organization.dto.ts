import { IsString, Length, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Name of the organization',
    example: 'Engineering Team',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiPropertyOptional({
    description:
      'Optional parent organization ID if creating a sub-organization',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number;
}

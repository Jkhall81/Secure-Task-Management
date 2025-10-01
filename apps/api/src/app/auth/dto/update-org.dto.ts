// auth/dto/update-org.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsInt } from 'class-validator';

export class UpdateOrgDto {
  @ApiProperty({
    example: 2,
    description: 'The ID of the organization to switch to',
  })
  @IsNumber()
  @IsInt()
  orgId: number;
}

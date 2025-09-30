import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddUserToOrgDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orgId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;
}

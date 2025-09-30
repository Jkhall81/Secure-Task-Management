import { IsString, Length } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @Length(2, 50)
  name: string;
}

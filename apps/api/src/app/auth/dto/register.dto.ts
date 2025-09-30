import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  roleName: string;

  @Type(() => Number)
  @IsInt()
  orgId: number;
}

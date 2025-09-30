import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  role: string;

  @Type(() => Number)
  @IsInt()
  orgId: number;
}

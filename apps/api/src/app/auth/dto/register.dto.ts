import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'newuser@example.com',
    description: 'The email address of the new user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The user’s password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'viewer',
    description: 'The role assigned to the user (e.g., owner, admin, viewer)',
  })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Organization ID if joining an existing org',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  orgId?: number;

  @ApiProperty({
    example: 'My New Organization',
    required: false,
    description: 'Organization name if creating a new one',
  })
  @IsOptional()
  @IsString()
  orgName?: string;
}

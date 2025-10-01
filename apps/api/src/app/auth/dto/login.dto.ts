import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The user’s password (min 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

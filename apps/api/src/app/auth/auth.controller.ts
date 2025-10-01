import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth') // Groups endpoints under "Auth" in Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user (optionally create org if none provided)',
  })
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto): Promise<User> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive a JWT token' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  // For testing
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get profile of the currently authenticated user' })
  @ApiBearerAuth()
  async getProfile(@Req() req: any) {
    return req.user; // comes from JwtStrategy.validate()
  }
}

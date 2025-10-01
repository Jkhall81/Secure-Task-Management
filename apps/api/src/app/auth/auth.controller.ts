import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common'; // Add Patch
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger'; // Add ApiResponse
import { UpdateOrgDto } from './dto/update-org.dto'; // Create this DTO

@ApiTags('Auth')
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get profile of the currently authenticated user' })
  @ApiBearerAuth()
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @Patch('update-org')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user organization',
    description: 'Update the current organization for the authenticated user',
  })
  @ApiBody({ type: UpdateOrgDto })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid organization ID',
  })
  @ApiResponse({
    status: 404,
    description: 'User or organization not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateUserOrganization(
    @Body() updateOrgDto: UpdateOrgDto,
    @Req() req: any
  ) {
    return this.authService.updateUserOrganization(
      req.user.id,
      updateOrgDto.orgId
    );
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Organizations') // Groups endpoints under "Organizations"
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  // Public endpoint: minimal org data for registration dropdown
  @Get('public')
  @ApiOperation({
    summary: 'Get public list of organizations (id + name only)',
  })
  async findPublic() {
    return this.orgService.findPublicOrgs();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner') // only owners can create orgs
  @ApiOperation({ summary: 'Create a new organization (Owner only)' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateOrganizationDto })
  async create(@Body() dto: CreateOrganizationDto) {
    return this.orgService.create(dto.name, dto.parentId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @ApiOperation({
    summary: 'Get all organizations with hierarchy (Owner/Admin only)',
  })
  @ApiBearerAuth()
  async findAll() {
    return this.orgService.findAllWithChildren(); // show hierarchy
  }

  @Post(':orgId/users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Add a user to an organization (Owner/Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'orgId', type: Number, description: 'Organization ID' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  async addUser(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    return this.orgService.addUserToOrg(userId, orgId);
  }
}

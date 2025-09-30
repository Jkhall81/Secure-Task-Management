import { Controller, Post, Get, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  @Roles('owner') // only owners can create orgs
  async create(@Body() dto: CreateOrganizationDto) {
    return this.orgService.create(dto.name, dto.parentId);
  }

  @Get()
  @Roles('owner', 'admin')
  async findAll() {
    return this.orgService.findAllWithChildren(); // show hierarchy
  }

  @Post(':orgId/users/:userId')
  @Roles('owner', 'admin')
  async addUser(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.orgService.addUserToOrg(userId, orgId);
  }
}

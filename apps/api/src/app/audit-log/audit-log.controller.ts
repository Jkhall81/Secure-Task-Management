import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles('owner', 'admin')
  async findAll(@Req() req: any) {
    return this.auditLogService.findAllForOrg(req.user.organization.id);
  }

  @Get('user/:id')
  @Roles('owner', 'admin')
  async findByUser(@Param('id', ParseIntPipe) userId: number, @Req() req: any) {
    return this.auditLogService.findByUserInOrg(
      userId,
      req.user.organization.id
    );
  }
}

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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Audit Log') // groups endpoints under "Audit Log" in Swagger
@ApiBearerAuth()
@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles('owner', 'admin')
  @ApiOperation({
    summary: 'Get all audit logs for current user’s organization',
  })
  async findAll(@Req() req: any) {
    return this.auditLogService.findAllForOrg(req.user.organization.id);
  }

  @Get('user/:id')
  @Roles('owner', 'admin')
  @ApiOperation({
    summary: 'Get audit logs for a specific user in the organization',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  async findByUser(@Param('id', ParseIntPipe) userId: number, @Req() req: any) {
    return this.auditLogService.findByUserInOrg(
      userId,
      req.user.organization.id
    );
  }
}

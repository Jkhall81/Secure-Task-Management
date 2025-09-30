import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';
import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly orgService: OrganizationService
  ) {}

  async logAction(action: string, targetId: number | null, user: User) {
    const log = this.auditRepo.create({
      action,
      targetId,
      user,
      organization: user.organization,
    });

    await this.auditRepo.save(log);

    console.log(
      `[AUDIT] ${action} by ${user.email} (org: ${user.organization?.name}) on target ${targetId}`
    );
  }

  async findAllForOrg(orgId: number): Promise<AuditLog[]> {
    const orgIds = await this.orgService.getOrgScope(orgId);

    return this.auditRepo.find({
      where: { organization: { id: In(orgIds) } },
      relations: ['user', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserInOrg(userId: number, orgId: number) {
    const orgIds = await this.orgService.getOrgScope(orgId);

    return this.auditRepo.find({
      where: {
        user: { id: userId },
        organization: { id: In(orgIds) },
      },
      relations: ['user', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }
}

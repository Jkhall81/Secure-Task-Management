import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>
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
    return this.auditRepo.find({
      where: { organization: { id: orgId } },
      relations: ['user', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserInOrg(userId: number, orgId: number) {
    return this.auditRepo.find({
      where: {
        user: { id: userId },
        organization: { id: orgId },
      },
      relations: ['user', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }
}

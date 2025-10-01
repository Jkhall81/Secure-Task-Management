import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async create(name: string, parentId?: number) {
    const org = this.orgRepo.create({ name });
    if (parentId) {
      const parent = await this.orgRepo.findOne({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Parent org not found');
      org.parent = parent;
    }
    return this.orgRepo.save(org);
  }

  async findPublicOrgs() {
    return this.orgRepo.find({
      select: ['id', 'name'], // only return safe fields
    });
  }

  async findAll() {
    return this.orgRepo.find({ relations: ['users'] });
  }

  async findAllWithChildren() {
    return this.orgRepo.find({ relations: ['users', 'children', 'parent'] });
  }

  async addUserToOrg(userId: number, orgId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    user.organization = org;
    return this.userRepo.save(user);
  }

  async getOrgScope(orgId: number): Promise<number[]> {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      relations: ['children'],
    });
    if (!org) throw new NotFoundException('Organization not found');

    // include parent org + its children
    return [org.id, ...org.children.map((c) => c.id)];
  }
}

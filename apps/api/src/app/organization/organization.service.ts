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

  async create(name: string) {
    const org = this.orgRepo.create({ name });
    return this.orgRepo.save(org);
  }

  async findAll() {
    return this.orgRepo.find({ relations: ['users'] });
  }

  async addUserToOrg(userId: number, orgId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    user.organization = org;
    return this.userRepo.save(user);
  }
}

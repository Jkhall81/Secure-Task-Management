import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Organization } from '../entities/organization.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    const { email, password, roleName, orgId } = dto;

    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) throw new BadRequestException('Email already exists');

    const hashed = await bcrypt.hash(password, 10);

    let organizations: Organization[] = [];

    // Handle organization assignment
    if (orgId) {
      // User is joining existing organization
      const org = await this.orgRepo.findOne({ where: { id: orgId } });
      if (!org)
        throw new BadRequestException(
          `Organization with id ${orgId} not found`
        );
      organizations = [org];
    } else {
      // User is creating a new organization
      const name = dto.orgName || `${email}'s Organization`;
      const newOrg = this.orgRepo.create({ name });
      await this.orgRepo.save(newOrg);
      organizations = [newOrg];
    }

    // Determine role - if creating org, default to 'owner', otherwise use provided role
    let role: Role;
    if (!roleName && !orgId) {
      // Creating new org → owner
      role = await this.roleRepo.findOne({ where: { name: 'owner' } });
    } else if (!roleName && orgId) {
      // Joining existing org without specified role → default to 'user'
      role = await this.roleRepo.findOne({ where: { name: 'user' } });
    } else {
      // Use provided role
      role = await this.roleRepo.findOne({ where: { name: roleName } });
    }

    if (!role) throw new BadRequestException(`Role "${roleName}" not found`);

    // Create user with organizations array
    const user = this.usersRepo.create({
      email,
      password: hashed,
      role,
      organizations, // This is now an ARRAY
    });

    return this.usersRepo.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      relations: ['role', 'organizations'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      orgId: user.organizations?.[0]?.id,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        organization: user.organizations?.[0]?.name,
      },
    };
  }

  async updateUserOrganization(userId: number, orgId: number) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['organizations'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Update user's organization
    if (user.organizations.length > 0) {
      user.organizations[0] = org;
    } else {
      user.organizations.push(org);
    }
    await this.usersRepo.save(user);

    return { message: 'Organization updated successfully' };
  }
}

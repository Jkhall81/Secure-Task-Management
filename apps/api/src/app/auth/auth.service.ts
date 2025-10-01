import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
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

    let org: Organization;

    if (orgId) {
      org = await this.orgRepo.findOne({ where: { id: orgId } });
      if (!org)
        throw new BadRequestException(
          `Organization with id ${orgId} not found`
        );
    } else {
      const name = dto.orgName || `${email}'s Organization`;
      org = this.orgRepo.create({ name });
      await this.orgRepo.save(org);
    }

    // If no roleName passed, default to 'owner' when creating org, else use provided
    let role: Role;
    if (!roleName && !orgId) {
      role = await this.roleRepo.findOne({ where: { name: 'owner' } });
    } else {
      role = await this.roleRepo.findOne({ where: { name: roleName } });
    }

    if (!role) throw new BadRequestException(`Role "${roleName}" not found`);

    const user = this.usersRepo.create({
      email,
      password: hashed,
      role,
      organization: org,
    });

    return this.usersRepo.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      relations: ['role', 'organization'],
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
      orgId: user.organization?.id,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        organization: user.organization?.name,
      },
    };
  }
}

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { RoleHierarchyService } from 'libs/auth/src/lib/role-hierarchy.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Organization]),
    PassportModule,
    OrganizationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey', // TODO move to .env in real apps
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, RoleHierarchyService],
  exports: [AuthService, RoleHierarchyService],
})
export class AuthModule {}

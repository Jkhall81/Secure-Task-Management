import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { Task } from '../entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User, Task])],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}

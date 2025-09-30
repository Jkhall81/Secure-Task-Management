import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from '../entities/task.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    AuditLogModule,
    OrganizationModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}

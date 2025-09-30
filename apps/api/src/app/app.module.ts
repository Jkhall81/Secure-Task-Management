import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'secure-task.db',
      entities: [User, Organization, Task, AuditLog, Role, Permission],
      synchronize: true, // dev only, auto creates tables
    }),
    TypeOrmModule.forFeature([
      User,
      Organization,
      Task,
      AuditLog,
      Role,
      Permission,
    ]),
    AuthModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

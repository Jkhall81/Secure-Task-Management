import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskIdParamDto } from './dto/task-id-param.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Permissions('CREATE_TASK')
  create(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(dto, req.user);
  }

  @Get()
  @Permissions('VIEW_TASK')
  findAll(@Req() req: any) {
    return this.tasksService.findAll(req.user);
  }

  @Put(':id')
  @Permissions('UPDATE_TASK')
  update(
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateTaskDto,
    @Req() req: any
  ) {
    return this.tasksService.update(params.id, dto, req.user);
  }

  @Delete(':id')
  @Permissions('DELETE_TASK')
  remove(@Param() params: TaskIdParamDto, @Req() req: any) {
    return this.tasksService.remove(params.id, req.user);
  }
}

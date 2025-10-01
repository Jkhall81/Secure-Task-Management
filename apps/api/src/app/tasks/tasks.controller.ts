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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('tasks')
@ApiBearerAuth() // all routes need JWT
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
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: missing permission' })
  findAll(@Req() req: any) {
    return this.tasksService.findAll(req.user);
  }

  @Put(':id')
  @Permissions('UPDATE_TASK')
  @ApiOperation({ summary: 'Update an existing task by ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateTaskDto,
    @Req() req: any
  ) {
    return this.tasksService.update(params.id, dto, req.user);
  }

  @Delete(':id')
  @Permissions('DELETE_TASK')
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param() params: TaskIdParamDto, @Req() req: any) {
    return this.tasksService.remove(params.id, req.user);
  }
}

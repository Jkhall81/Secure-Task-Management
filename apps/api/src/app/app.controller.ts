import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App') // groups it under "App" in Swagger UI
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint, may do something with this later' })
  getData() {
    return this.appService.getData();
  }
}

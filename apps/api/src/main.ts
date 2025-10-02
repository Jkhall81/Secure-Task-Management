/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';
import { seedRolesAndPermissions } from './app/seeds/role-permission.seed';
// import { seedOrganizations } from './app/seeds/organization.seed';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown properties
      forbidNonWhitelisted: true, // throws error if extra fields are passed
      transform: true, // auto-transform payloads to DTO instances
    })
  );

  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  const dataSource = app.get(DataSource);

  await seedRolesAndPermissions(dataSource);
  // await seedOrganizations(dataSource);

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('Secure Task Management API')
    .setDescription('API documentation for the Secure Task Management System')
    .setVersion('1.0')
    .addBearerAuth() // adds JWT auth field in Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `Swagger docs available at: http://localhost:${port}/${globalPrefix}/docs`
  );
}

bootstrap();

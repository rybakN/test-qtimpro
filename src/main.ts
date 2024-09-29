import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yamljs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Articles API')
    .setDescription(
      'A comprehensive API documentation for the authentication and articles endpoints.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const openApiPath = join(__dirname, '..', '..', 'openApi/openapi.yaml');
  const openApiDocument = YAML.parse(readFileSync(openApiPath, 'utf8'));
  const mergedDocument = {
    ...document,
    ...openApiDocument,
  };
  SwaggerModule.setup('api', app, mergedDocument);

  const configService = app.get(ConfigService);
  await app.listen(configService.get<number>('app.port'));
}
bootstrap();

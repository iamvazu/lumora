import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: process.env['NODE_ENV'] === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
  });

  // Security headers
  app.use(helmet());
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: [
      process.env['WEB_URL'] || 'http://localhost:3000',
      process.env['ADMIN_URL'] || 'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-ID'],
  });

  // API prefix /v1
  app.setGlobalPrefix('v1');

  // RFC 9457 Problem Details Exception Filter
  app.useGlobalFilters(new ProblemDetailsFilter());

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  const port = process.env['PORT'] || 4000;
  await app.listen(port);
  logger.log(`Lumora API is running on http://localhost:${port}/v1`);
}

bootstrap();

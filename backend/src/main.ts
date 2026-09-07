import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const corsOrigins = configService.get<string>('CORS_ORIGINS');

  if (corsOrigins) {
    app.enableCors({
      origin: corsOrigins.split(',').map((origin) => origin.trim()),
      credentials: true,
    });
  }

  app.enableShutdownHooks();

  await app.listen(configService.get<number>('PORT', 4000));
}

await bootstrap();

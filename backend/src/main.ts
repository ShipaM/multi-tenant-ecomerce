// ValidationPipe: built-in pipe that validates/transforms incoming payloads using class-validator + class-transformer decorators on DTOs.
import { ValidationPipe } from '@nestjs/common';
// ConfigService: injectable service from @nestjs/config that reads validated environment variables (.env + schema).
import { ConfigService } from '@nestjs/config';
// NestFactory: factory that builds the Nest application instance out of the root module.
import { NestFactory } from '@nestjs/core';
// helmet: Express middleware that sets security-related HTTP headers (CSP, HSTS, X-Frame-Options, ...).
import helmet from 'helmet';
// AppModule: the root module; its imports/providers form the whole dependency injection graph.
import { AppModule } from './app.module.js';
// AllExceptionsFilter: catch-all filter that logs failures and shapes every error response.
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

// bootstrap(): the async entry point that creates, configures and starts the HTTP server.
async function bootstrap() {
  // Instantiates the app: scans AppModule, resolves every provider, and wires the default Express adapter.
  const app = await NestFactory.create(AppModule);
  // Pulls ConfigService out of the DI container manually, because outside of classes there is no constructor injection.
  const configService = app.get(ConfigService);

  // Registers helmet as global middleware, so every response carries the hardened security headers.
  app.use(helmet());

  // Registers a pipe that runs for every route handler before the controller method is called.
  app.useGlobalPipes(
    new ValidationPipe({
      // Strips properties that are not declared in the DTO, so unexpected fields never reach the business logic.
      whitelist: true,
      // Rejects the request with 400 instead of silently stripping when unknown properties are present.
      forbidNonWhitelisted: true,
      // Converts the plain JSON body into an actual instance of the DTO class.
      transform: true,
      // Coerces primitives from their string form (query/params) into the type declared in the DTO, e.g. "5" -> 5.
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Registers the catch-all error filter, so unhandled exceptions are logged with
  // their request and returned in one consistent shape instead of a bare 500.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Reads the comma-separated list of allowed browser origins from the environment.
  const corsOrigins = configService.get<string>('CORS_ORIGINS');

  // CORS stays disabled unless the variable is set, which keeps the API closed by default.
  if (corsOrigins) {
    app.enableCors({
      // Splits "a.com,b.com" into an array and trims stray spaces around each origin.
      origin: corsOrigins.split(',').map((origin) => origin.trim()),
      // Allows the browser to send cookies / Authorization headers on cross-origin requests.
      credentials: true,
    });
  }

  // Makes Nest listen to process signals (SIGTERM, SIGINT) and run onModuleDestroy/onApplicationShutdown hooks,
  // so things like the Prisma connection close cleanly on redeploy.
  app.enableShutdownHooks();

  // Starts the HTTP server on the configured port, falling back to 4000 when PORT is not defined.
  await app.listen(configService.get<number>('PORT', 4000));
}

// Top-level await starts the application; it works because the project is compiled as an ES module.
await bootstrap();

import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

const MIN_SECRET_LENGTH = 32;

const EXPIRES_IN_PATTERN = /^\d+(ms|s|m|h|d|w|y)$/;

export type ExpiresIn = `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;

export class EnvironmentVariables {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 4000;

  @IsOptional()
  @IsString()
  CORS_ORIGINS: string;

  @IsString()
  @MinLength(MIN_SECRET_LENGTH)
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(MIN_SECRET_LENGTH)
  JWT_REFRESH_SECRET: string;

  // Any span accepted by the `ms` package, e.g. "15m", "7d", "3600s".
  @IsOptional()
  @Matches(EXPIRES_IN_PATTERN)
  JWT_ACCESS_EXPIRES_IN: ExpiresIn = '15m';

  @IsOptional()
  @Matches(EXPIRES_IN_PATTERN)
  JWT_REFRESH_EXPIRES_IN: ExpiresIn = '30d';
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return validated;
}

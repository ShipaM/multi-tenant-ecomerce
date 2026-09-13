import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request>();

    return request.user as AuthenticatedUser;
  },
);

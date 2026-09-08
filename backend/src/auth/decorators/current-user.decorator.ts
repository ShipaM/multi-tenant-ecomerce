import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../types/jwt-payload.type.js';

/// Pulls out whatever JwtStrategy.validate returned. Only meaningful on routes
/// behind JwtAuthGuard; without the guard passport never populates the request
/// and this yields undefined.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request>();

    return request.user as AuthenticatedUser;
  },
);

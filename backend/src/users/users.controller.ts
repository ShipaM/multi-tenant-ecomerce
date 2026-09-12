import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.userId, dto);
  }
}

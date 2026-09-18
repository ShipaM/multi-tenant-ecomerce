import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login-dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import type { AuthenticatedUser } from './types/jwt-payload.type.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import {
  TwoFactorDto,
  TwoFactorVerifyLoginOtpDto,
} from './dto/two-factor.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.login(loginDto.email, loginDto.password, {
      ipAddress: ip,
      deviceLabel: userAgent,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.refresh(refreshTokenDto.refreshToken, {
      ipAddress: ip,
      deviceLabel: userAgent,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.sessionId);
    return { success: true };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    const data = this.authService.me(user.userId);

    return data;
  }

  @Post('2fa-generate-otp')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async twoFactorEnable(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.twoFactorEnable(user.userId);
  }

  @Post('2fa-verify-enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async twoFactorVerifyEnable(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TwoFactorDto,
  ) {
    return this.authService.twoFactorVerifyEnable(user.userId, dto.otp);
  }

  @Post('2fa-verify-login-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async twoFactorVerifyLoginOtp(
    @Body() dto: TwoFactorVerifyLoginOtpDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.twoFactorVerifyLoginOtp(
      dto.twoFactorToken,
      dto.otp,
      { ipAddress: ip, deviceLabel: userAgent },
    );
  }
}

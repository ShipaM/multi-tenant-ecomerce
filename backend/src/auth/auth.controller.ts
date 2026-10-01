import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
  TwoFactorDto,
  TwoFactorVerifyLoginOtpDto,
} from './dto/index';
import type { AuthenticatedUser } from './types/jwt-payload.type';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUserAgent } from '../common/decorators/user-agent.decorator';
import type { UserAgentInfo } from '../common/types/user-agent.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @ParseUserAgent() userAgent: UserAgentInfo,
  ) {
    return this.authService.login(loginDto.email, loginDto.password, {
      ipAddress: ip,
      device: userAgent.device.model,
      os: userAgent.os.name,
      browser: userAgent.browser.name,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
    @ParseUserAgent() userAgent: UserAgentInfo,
  ) {
    return this.authService.refresh(refreshTokenDto.refreshToken, {
      ipAddress: ip,
      device: userAgent.device.model,
      os: userAgent.os.name,
      browser: userAgent.browser.name,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.userId, user.sessionId);
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
    @ParseUserAgent() userAgent: UserAgentInfo,
  ) {
    return this.authService.twoFactorVerifyLoginOtp(
      dto.twoFactorToken,
      dto.otp,
      {
        ipAddress: ip,
        device: userAgent.device.model,
        os: userAgent.os.name,
        browser: userAgent.browser.name,
      },
    );
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async sessions(@CurrentUser() user: AuthenticatedUser) {
    const sessions = await this.authService.listSessions(user.userId);

    return sessions.map((session) => ({
      deviceLabel: session.deviceLabel,
      ipAddress: session.ipAddress,
      lastActiveAt: session.lastActiveAt,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      isCurrent: session.id === user.sessionId,
      os: session.os,
      device: session.device,
      browser: session.browser,
    }));
  }

  @Post('sessions/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
  ) {
    await this.authService.revokeSession(user.userId, sessionId);
    return { success: true };
  }

  @Post('sessions/revoke-others')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async revokeOtherSessions(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.revokeOtherSessions(user.userId, user.sessionId);
    return { success: true };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('forgot-password/verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPasswordVerifyOtp(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPasswordOtpVerification(dto.email, dto.otp!);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.resetToken, dto.password);
  }
}

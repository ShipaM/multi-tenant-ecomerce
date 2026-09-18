import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.fromEmail = this.config.getOrThrow<string>('RESEND_FROM_EMAIL')!;
  }

  async sendOtp2FAuser(
    userName: string,
    toEmail: string,
    otpCode: string,
    expiredOtp: string,
  ): Promise<void> {
    this.logger.log('Sending otp 2fa');
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject: 'Your Two-Factor Authentication (2FA) code',
        html: `
        <div style="font-family:sans-serif">
          <p>Your Two-Factor Authentication (2FA) code:</p>
          <h2 style="letter-spacing:4px">${otpCode}</h2>
          <p>The code will expire in ${expiredOtp}. If it wasn't you, just ignore the letter.</p>
        </div>
      `,
      });
    } catch (error) {
      this.logger.error(`Resend Send Failed: ${(error as Error)?.message}`);
      throw new InternalServerErrorException('Failed to send OTP email');
    }
  }
}

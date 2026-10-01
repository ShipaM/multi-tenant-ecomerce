import { IsNotEmpty, IsString } from 'class-validator';

export class TwoFactorVerifyLoginOtpDto {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  twoFactorToken: string;
}

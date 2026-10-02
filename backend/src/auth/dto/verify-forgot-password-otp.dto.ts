import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyForgotPasswordOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}

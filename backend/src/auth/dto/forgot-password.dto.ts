import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  otp?: string;
}

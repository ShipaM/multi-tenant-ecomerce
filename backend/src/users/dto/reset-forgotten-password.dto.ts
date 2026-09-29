import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetForgottenPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

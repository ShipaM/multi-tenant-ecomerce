import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

// Only fields a user is allowed to edit on their own profile.
// status/userType/password are intentionally never accepted here.
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}

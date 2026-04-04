import {
  IsString,
  IsMobilePhone,
  IsOptional,
  IsEmail,
  MinLength,
  IsIn,
  IsDateString,
  Matches,
  Length,
} from 'class-validator';

export class SendOtpDto {
  @IsMobilePhone('en-IN', {}, { message: 'Enter a valid Indian mobile number' })
  mobile: string;
}

export class VerifyOtpDto {
  @IsMobilePhone('en-IN', {}, { message: 'Enter a valid Indian mobile number' })
  mobile: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;
}

export class LoginDto {
  @IsMobilePhone('en-IN', {}, { message: 'Enter a valid Indian mobile number' })
  mobile: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class AddressDto {
  @IsString()
  line1: string;

  @IsString()
  @IsOptional()
  line2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Enter a valid 6-digit pincode' })
  pincode: string;
}

export class RegisterDto {
  @IsMobilePhone('en-IN', {}, { message: 'Enter a valid Indian mobile number' })
  mobile: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  @IsOptional()
  gender?: string;

  @IsOptional()
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

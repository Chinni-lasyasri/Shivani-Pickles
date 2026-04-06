/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  LoginDto,
  RegisterDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Send OTP to mobile (used for both login and registration) */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  /** Verify OTP during registration (pre-password step) */
  @Post('verify-otp-register')
  @HttpCode(HttpStatus.OK)
  verifyOtpRegister(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpRegister(dto);
  }

  /** Complete registration with personal + address details */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** Login with mobile + password */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Login with mobile + OTP */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtpLogin(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpLogin(dto);
  }

  /** Get logged-in user profile */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }
}

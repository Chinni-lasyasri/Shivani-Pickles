/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import {
  SendOtpDto,
  VerifyOtpDto,
  LoginDto,
  RegisterDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private issueToken(user: User): string {
    const payload = { sub: user.id, mobile: user.mobile };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, otpHash, otpExpiresAt, ...safe } = user as any;
    return safe;
  }

  // ── Send OTP ─────────────────────────────────────────────────────────────

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 8);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Upsert user record (or just store OTP on existing user)
    let user = await this.userRepo.findOne({ where: { mobile: dto.mobile } });
    if (!user) {
      user = this.userRepo.create({ mobile: dto.mobile });
    }
    user.otpHash = otpHash;
    user.otpExpiresAt = otpExpiresAt;
    await this.userRepo.save(user);

    // TODO: Integrate with real SMS provider (Twilio, MSG91, etc.)
    // For now, log the OTP in development
    this.logger.log(`📱 OTP for ${dto.mobile}: ${otp}`);

    return { message: `OTP sent to ${dto.mobile}` };
  }

  // ── Verify OTP (for registration pre-check) ───────────────────────────────

  async verifyOtpRegister(dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.otpHash')
      .addSelect('user.otpExpiresAt')
      .where('user.mobile = :mobile', { mobile: dto.mobile })
      .getOne();

    if (!user)
      throw new NotFoundException(
        'Mobile number not found. Please send OTP first.',
      );

    if (!user.otpHash || !user.otpExpiresAt)
      throw new BadRequestException('No OTP found. Please request a new OTP.');

    if (new Date() > user.otpExpiresAt)
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );

    const isValid = await bcrypt.compare(dto.otp, user.otpHash);
    if (!isValid)
      throw new BadRequestException('Invalid OTP. Please try again.');

    // Mark mobile verified but don't clear OTP (we need it implicitly confirmed)
    user.mobileVerified = true;
    await this.userRepo.save(user);

    return { verified: true };
  }

  // ── Register ──────────────────────────────────────────────────────────────

  async register(
    dto: RegisterDto,
  ): Promise<{ access_token: string; user: any }> {
    // Check mobile verified
    const existing = await this.userRepo
      .createQueryBuilder('user')
      .where('user.mobile = :mobile', { mobile: dto.mobile })
      .getOne();

    if (existing && existing.mobileVerified === false) {
      throw new BadRequestException(
        'Please verify your mobile number with OTP first.',
      );
    }

    if (existing && existing.firstName) {
      throw new ConflictException(
        'An account with this mobile number already exists.',
      );
    }

    // Check email uniqueness
    if (dto.email) {
      const emailExists = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (emailExists && emailExists.mobile !== dto.mobile) {
        throw new ConflictException(
          'This email is already in use by another account.',
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = existing || this.userRepo.create({ mobile: dto.mobile });
    user.password = passwordHash;
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    if (dto.email) user.email = dto.email;
    if (dto.dob) user.dob = dto.dob;
    if (dto.gender) user.gender = dto.gender;
    if (dto.address) {
      user.addressLine1 = dto.address.line1;
      user.addressLine2 = dto.address.line2 ?? (undefined as any);
      user.city = dto.address.city;
      user.state = dto.address.state;
      user.pincode = dto.address.pincode;
    }
    user.mobileVerified = true;
    user.otpHash = undefined as any;
    user.otpExpiresAt = undefined as any;

    await this.userRepo.save(user);

    const access_token = this.issueToken(user);
    return { access_token, user: this.sanitizeUser(user) };
  }

  // ── Login with Password ───────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<{ access_token: string; user: any }> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.mobile = :mobile', { mobile: dto.mobile })
      .getOne();

    if (!user)
      throw new UnauthorizedException(
        'No account found with this mobile number.',
      );
    if (!user.firstName)
      throw new UnauthorizedException('Account registration is incomplete.');
    if (!user.isActive)
      throw new UnauthorizedException('Your account has been deactivated.');
    if (!user.password)
      throw new BadRequestException(
        'This account uses OTP login. Please use OTP to sign in.',
      );

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch)
      throw new UnauthorizedException('Incorrect password. Please try again.');

    const access_token = this.issueToken(user);
    return { access_token, user: this.sanitizeUser(user) };
  }

  // ── Login with OTP ────────────────────────────────────────────────────────

  async verifyOtpLogin(
    dto: VerifyOtpDto,
  ): Promise<{ access_token: string; user: any }> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.otpHash')
      .addSelect('user.otpExpiresAt')
      .where('user.mobile = :mobile', { mobile: dto.mobile })
      .getOne();

    if (!user)
      throw new NotFoundException('No account found with this mobile number.');
    if (!user.firstName)
      throw new BadRequestException('Please complete registration first.');
    if (!user.isActive)
      throw new UnauthorizedException('Your account has been deactivated.');

    if (!user.otpHash || !user.otpExpiresAt)
      throw new BadRequestException('No OTP found. Please request a new OTP.');

    if (new Date() > user.otpExpiresAt)
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );

    const isValid = await bcrypt.compare(dto.otp, user.otpHash);
    if (!isValid)
      throw new UnauthorizedException('Invalid OTP. Please try again.');

    // Clear OTP after use
    user.otpHash = undefined as any;
    user.otpExpiresAt = undefined as any;
    await this.userRepo.save(user);

    const access_token = this.issueToken(user);
    return { access_token, user: this.sanitizeUser(user) };
  }

  // ── Get current user ──────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return this.sanitizeUser(user);
  }
}

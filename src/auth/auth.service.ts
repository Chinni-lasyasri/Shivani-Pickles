/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
    // return Math.floor(100000 + Math.random() * 900000).toString();
    return '123456';
  }

  private issueToken(user: User): string {
    const payload = { sub: user.id, mobile: user.mobile, role: user.role };
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
    const users: any[] = await this.userRepo.query(
      'SELECT * FROM users WHERE mobile = $1',
      [dto.mobile],
    );
    if (users.length === 0) {
      const insertQuery = `
        INSERT INTO users (id, mobile, role, "mobileVerified", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, 'user', false, true, NOW(), NOW())
        RETURNING *
      `;
      const result: any[] = await this.userRepo.query(insertQuery, [
        dto.mobile,
      ]);
      users.push(result[0]);
    }
    const user = users[0];
    await this.userRepo.query(
      'UPDATE users SET "otpHash" = $1, "otpExpiresAt" = $2, "updatedAt" = NOW() WHERE id = $3',
      [otpHash, otpExpiresAt, user.id],
    );

    // TODO: Integrate with real SMS provider (Twilio, MSG91, etc.)
    // For now, log the OTP in development
    this.logger.log(`📱 OTP for ${dto.mobile}: ${otp}`);

    return { message: `OTP sent to ${dto.mobile}` };
  }

  // ── Verify OTP (for registration pre-check) ───────────────────────────────

  async verifyOtpRegister(dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    const users: any[] = await this.userRepo.query(
      'SELECT id, "otpHash", "otpExpiresAt", "mobileVerified" FROM users WHERE mobile = $1',
      [dto.mobile],
    );

    if (users.length === 0)
      throw new NotFoundException(
        'Mobile number not found. Please send OTP first.',
      );

    const user = users[0];
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
    await this.userRepo.query(
      'UPDATE users SET "mobileVerified" = true, "updatedAt" = NOW() WHERE id = $1',
      [user.id],
    );

    return { verified: true };
  }

  // ── Register ──────────────────────────────────────────────────────────────

  async register(
    dto: RegisterDto,
  ): Promise<{ access_token: string; user: any }> {
    // Check mobile verified
    const existingUsers: any[] = await this.userRepo.query(
      'SELECT * FROM users WHERE mobile = $1',
      [dto.mobile],
    );

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.mobileVerified === false) {
        throw new BadRequestException(
          'Please verify your mobile number with OTP first.',
        );
      }

      if (existing.firstName) {
        throw new ConflictException(
          'An account with this mobile number already exists.',
        );
      }
    }

    // Check email uniqueness
    if (dto.email) {
      const emailUsers: any[] = await this.userRepo.query(
        'SELECT * FROM users WHERE email = $1 AND mobile != $2',
        [dto.email, dto.mobile],
      );
      if (emailUsers.length > 0) {
        throw new ConflictException(
          'This email is already in use by another account.',
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    let user: any;
    if (existingUsers.length > 0) {
      user = existingUsers[0];
      const updateQuery = `
        UPDATE users
        SET password = $1, "firstName" = $2, "lastName" = $3, email = $4, dob = $5, gender = $6,
            "addressLine1" = $7, "addressLine2" = $8, city = $9, state = $10, pincode = $11,
            "mobileVerified" = true, "otpHash" = NULL, "otpExpiresAt" = NULL, "updatedAt" = NOW()
        WHERE id = $12
        RETURNING *
      `;
      const result: any[] = await this.userRepo.query(updateQuery, [
        passwordHash,
        dto.firstName,
        dto.lastName,
        dto.email || null,
        dto.dob || null,
        dto.gender || null,
        dto.address?.line1 || null,
        dto.address?.line2 || null,
        dto.address?.city || null,
        dto.address?.state || null,
        dto.address?.pincode || null,
        user.id,
      ]);
      user = result[0];
    } else {
      const insertQuery = `
        INSERT INTO users (id, mobile, password, "firstName", "lastName", email, dob, gender,
                          "addressLine1", "addressLine2", city, state, pincode, role,
                          "mobileVerified", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'user', true, true, NOW(), NOW())
        RETURNING *
      `;
      const result: any[] = await this.userRepo.query(insertQuery, [
        dto.mobile,
        passwordHash,
        dto.firstName,
        dto.lastName,
        dto.email || null,
        dto.dob || null,
        dto.gender || null,
        dto.address?.line1 || null,
        dto.address?.line2 || null,
        dto.address?.city || null,
        dto.address?.state || null,
        dto.address?.pincode || null,
      ]);
      user = result[0];
    }

    const access_token = this.issueToken(user as User);
    return { access_token, user: this.sanitizeUser(user as User) };
  }

  // ── Login with Password ───────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<{ access_token: string; user: any }> {
    const users: any[] = await this.userRepo.query(
      'SELECT * FROM users WHERE mobile = $1',
      [dto.mobile],
    );

    console.log('Login details:', dto);
    console.log('users details:', users);

    if (users.length === 0)
      throw new UnauthorizedException(
        'No account found with this mobile number.',
      );

    const user = users[0];
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

    const access_token = this.issueToken(user as User);
    return { access_token, user: this.sanitizeUser(user as User) };
  }

  // ── Login with OTP ────────────────────────────────────────────────────────

  async verifyOtpLogin(
    dto: VerifyOtpDto,
  ): Promise<{ access_token: string; user: any }> {
    const users: any[] = await this.userRepo.query(
      'SELECT id, "otpHash", "otpExpiresAt", "firstName", "isActive" FROM users WHERE mobile = $1',
      [dto.mobile],
    );

    if (users.length === 0)
      throw new NotFoundException('No account found with this mobile number.');

    const user = users[0];
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
    await this.userRepo.query(
      'UPDATE users SET "otpHash" = NULL, "otpExpiresAt" = NULL, "updatedAt" = NOW() WHERE id = $1',
      [user.id],
    );

    const fullUser: any[] = await this.userRepo.query(
      'SELECT * FROM users WHERE id = $1',
      [user.id],
    );
    const access_token = this.issueToken(fullUser[0] as User);
    return { access_token, user: this.sanitizeUser(fullUser[0] as User) };
  }

  // ── Get current user ──────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<any> {
    const users: any[] = await this.userRepo.query(
      'SELECT * FROM users WHERE id = $1',
      [userId],
    );
    if (users.length === 0) throw new NotFoundException('User not found.');
    return this.sanitizeUser(users[0] as User);
  }
}

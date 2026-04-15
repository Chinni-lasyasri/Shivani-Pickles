"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("./entities/user.entity");
let AuthService = AuthService_1 = class AuthService {
    userRepo;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepo, jwtService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
    }
    generateOtp() {
        return '123456';
    }
    issueToken(user) {
        const payload = { sub: user.id, mobile: user.mobile, role: user.role };
        return this.jwtService.sign(payload);
    }
    sanitizeUser(user) {
        const { password, otpHash, otpExpiresAt, ...safe } = user;
        return safe;
    }
    async sendOtp(dto) {
        const otp = this.generateOtp();
        const otpHash = await bcrypt.hash(otp, 8);
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const users = await this.userRepo.query('SELECT * FROM users WHERE mobile = $1', [dto.mobile]);
        if (users.length === 0) {
            const insertQuery = `
        INSERT INTO users (id, mobile, role, "mobileVerified", active, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, 'user', false, 1, NOW(), NOW())
        RETURNING *
      `;
            const result = await this.userRepo.query(insertQuery, [
                dto.mobile,
            ]);
            users.push(result[0]);
        }
        const user = users[0];
        await this.userRepo.query('UPDATE users SET "otpHash" = $1, "otpExpiresAt" = $2, "updatedAt" = NOW() WHERE id = $3', [otpHash, otpExpiresAt, user.id]);
        this.logger.log(`📱 OTP for ${dto.mobile}: ${otp}`);
        return { message: `OTP sent to ${dto.mobile}` };
    }
    async verifyOtpRegister(dto) {
        const users = await this.userRepo.query('SELECT id, "otpHash", "otpExpiresAt", "mobileVerified" FROM users WHERE mobile = $1', [dto.mobile]);
        if (users.length === 0)
            throw new common_1.NotFoundException('Mobile number not found. Please send OTP first.');
        const user = users[0];
        if (!user.otpHash || !user.otpExpiresAt)
            throw new common_1.BadRequestException('No OTP found. Please request a new OTP.');
        if (new Date() > user.otpExpiresAt)
            throw new common_1.BadRequestException('OTP has expired. Please request a new one.');
        const isValid = await bcrypt.compare(dto.otp, user.otpHash);
        if (!isValid)
            throw new common_1.BadRequestException('Invalid OTP. Please try again.');
        await this.userRepo.query('UPDATE users SET "mobileVerified" = true, "updatedAt" = NOW() WHERE id = $1', [user.id]);
        return { verified: true };
    }
    async register(dto) {
        const existingUsers = await this.userRepo.query('SELECT * FROM users WHERE mobile = $1', [dto.mobile]);
        if (existingUsers.length > 0) {
            const existing = existingUsers[0];
            if (existing.mobileVerified === false) {
                throw new common_1.BadRequestException('Please verify your mobile number with OTP first.');
            }
            if (existing.firstName) {
                throw new common_1.ConflictException('An account with this mobile number already exists.');
            }
        }
        if (dto.email) {
            const emailUsers = await this.userRepo.query('SELECT * FROM users WHERE email = $1 AND mobile != $2', [dto.email, dto.mobile]);
            if (emailUsers.length > 0) {
                throw new common_1.ConflictException('This email is already in use by another account.');
            }
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        let user;
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
            const result = await this.userRepo.query(updateQuery, [
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
        }
        else {
            const insertQuery = `
        INSERT INTO users (id, mobile, password, "firstName", "lastName", email, dob, gender,
                          "addressLine1", "addressLine2", city, state, pincode, role,
                          "mobileVerified", active, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'user', true, 1, NOW(), NOW())
        RETURNING *
      `;
            const result = await this.userRepo.query(insertQuery, [
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
        const access_token = this.issueToken(user);
        return { access_token, user: this.sanitizeUser(user) };
    }
    async login(dto) {
        const users = await this.userRepo.query('SELECT * FROM users WHERE mobile = $1', [dto.mobile]);
        console.log('Login details:', dto);
        console.log('users details:', users);
        if (users.length === 0)
            throw new common_1.UnauthorizedException('No account found with this mobile number.');
        const user = users[0];
        if (!user.firstName)
            throw new common_1.UnauthorizedException('Account registration is incomplete.');
        if (user.active !== 1)
            throw new common_1.UnauthorizedException('Your account has been deactivated.');
        if (!user.password)
            throw new common_1.BadRequestException('This account uses OTP login. Please use OTP to sign in.');
        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch)
            throw new common_1.UnauthorizedException('Incorrect password. Please try again.');
        const access_token = this.issueToken(user);
        return { access_token, user: this.sanitizeUser(user) };
    }
    async verifyOtpLogin(dto) {
        const users = await this.userRepo.query('SELECT id, "otpHash", "otpExpiresAt", "firstName", active FROM users WHERE mobile = $1', [dto.mobile]);
        if (users.length === 0)
            throw new common_1.NotFoundException('No account found with this mobile number.');
        const user = users[0];
        if (!user.firstName)
            throw new common_1.BadRequestException('Please complete registration first.');
        if (user.active !== 1)
            throw new common_1.UnauthorizedException('Your account has been deactivated.');
        if (!user.otpHash || !user.otpExpiresAt)
            throw new common_1.BadRequestException('No OTP found. Please request a new OTP.');
        if (new Date() > user.otpExpiresAt)
            throw new common_1.BadRequestException('OTP has expired. Please request a new one.');
        const isValid = await bcrypt.compare(dto.otp, user.otpHash);
        if (!isValid)
            throw new common_1.UnauthorizedException('Invalid OTP. Please try again.');
        await this.userRepo.query('UPDATE users SET "otpHash" = NULL, "otpExpiresAt" = NULL, "updatedAt" = NOW() WHERE id = $1', [user.id]);
        const fullUser = await this.userRepo.query('SELECT * FROM users WHERE id = $1', [user.id]);
        const access_token = this.issueToken(fullUser[0]);
        return { access_token, user: this.sanitizeUser(fullUser[0]) };
    }
    async getProfile(userId) {
        const users = await this.userRepo.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (users.length === 0)
            throw new common_1.NotFoundException('User not found.');
        return this.sanitizeUser(users[0]);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
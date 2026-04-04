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
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    issueToken(user) {
        const payload = { sub: user.id, mobile: user.mobile };
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
        let user = await this.userRepo.findOne({ where: { mobile: dto.mobile } });
        if (!user) {
            user = this.userRepo.create({ mobile: dto.mobile });
        }
        user.otpHash = otpHash;
        user.otpExpiresAt = otpExpiresAt;
        await this.userRepo.save(user);
        this.logger.log(`📱 OTP for ${dto.mobile}: ${otp}`);
        return { message: `OTP sent to ${dto.mobile}` };
    }
    async verifyOtpRegister(dto) {
        const user = await this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.otpHash')
            .addSelect('user.otpExpiresAt')
            .where('user.mobile = :mobile', { mobile: dto.mobile })
            .getOne();
        if (!user)
            throw new common_1.NotFoundException('Mobile number not found. Please send OTP first.');
        if (!user.otpHash || !user.otpExpiresAt)
            throw new common_1.BadRequestException('No OTP found. Please request a new OTP.');
        if (new Date() > user.otpExpiresAt)
            throw new common_1.BadRequestException('OTP has expired. Please request a new one.');
        const isValid = await bcrypt.compare(dto.otp, user.otpHash);
        if (!isValid)
            throw new common_1.BadRequestException('Invalid OTP. Please try again.');
        user.mobileVerified = true;
        await this.userRepo.save(user);
        return { verified: true };
    }
    async register(dto) {
        const existing = await this.userRepo
            .createQueryBuilder('user')
            .where('user.mobile = :mobile', { mobile: dto.mobile })
            .getOne();
        if (existing && existing.mobileVerified === false) {
            throw new common_1.BadRequestException('Please verify your mobile number with OTP first.');
        }
        if (existing && existing.firstName) {
            throw new common_1.ConflictException('An account with this mobile number already exists.');
        }
        if (dto.email) {
            const emailExists = await this.userRepo.findOne({ where: { email: dto.email } });
            if (emailExists && emailExists.mobile !== dto.mobile) {
                throw new common_1.ConflictException('This email is already in use by another account.');
            }
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = existing || this.userRepo.create({ mobile: dto.mobile });
        user.password = passwordHash;
        user.firstName = dto.firstName;
        user.lastName = dto.lastName;
        if (dto.email)
            user.email = dto.email;
        if (dto.dob)
            user.dob = dto.dob;
        if (dto.gender)
            user.gender = dto.gender;
        if (dto.address) {
            user.addressLine1 = dto.address.line1;
            user.addressLine2 = dto.address.line2 ?? undefined;
            user.city = dto.address.city;
            user.state = dto.address.state;
            user.pincode = dto.address.pincode;
        }
        user.mobileVerified = true;
        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        await this.userRepo.save(user);
        const access_token = this.issueToken(user);
        return { access_token, user: this.sanitizeUser(user) };
    }
    async login(dto) {
        const user = await this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.mobile = :mobile', { mobile: dto.mobile })
            .getOne();
        if (!user)
            throw new common_1.UnauthorizedException('No account found with this mobile number.');
        if (!user.firstName)
            throw new common_1.UnauthorizedException('Account registration is incomplete.');
        if (!user.isActive)
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
        const user = await this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.otpHash')
            .addSelect('user.otpExpiresAt')
            .where('user.mobile = :mobile', { mobile: dto.mobile })
            .getOne();
        if (!user)
            throw new common_1.NotFoundException('No account found with this mobile number.');
        if (!user.firstName)
            throw new common_1.BadRequestException('Please complete registration first.');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Your account has been deactivated.');
        if (!user.otpHash || !user.otpExpiresAt)
            throw new common_1.BadRequestException('No OTP found. Please request a new OTP.');
        if (new Date() > user.otpExpiresAt)
            throw new common_1.BadRequestException('OTP has expired. Please request a new one.');
        const isValid = await bcrypt.compare(dto.otp, user.otpHash);
        if (!isValid)
            throw new common_1.UnauthorizedException('Invalid OTP. Please try again.');
        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        await this.userRepo.save(user);
        const access_token = this.issueToken(user);
        return { access_token, user: this.sanitizeUser(user) };
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        return this.sanitizeUser(user);
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
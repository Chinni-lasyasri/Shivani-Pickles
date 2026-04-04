import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { SendOtpDto, VerifyOtpDto, LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    private readonly logger;
    constructor(userRepo: Repository<User>, jwtService: JwtService);
    private generateOtp;
    private issueToken;
    private sanitizeUser;
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
    }>;
    verifyOtpRegister(dto: VerifyOtpDto): Promise<{
        verified: boolean;
    }>;
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: any;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: any;
    }>;
    verifyOtpLogin(dto: VerifyOtpDto): Promise<{
        access_token: string;
        user: any;
    }>;
    getProfile(userId: string): Promise<any>;
}

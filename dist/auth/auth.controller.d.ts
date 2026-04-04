import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    getProfile(req: any): Promise<any>;
}

export declare class SendOtpDto {
    mobile: string;
}
export declare class VerifyOtpDto {
    mobile: string;
    otp: string;
}
export declare class LoginDto {
    mobile: string;
    password: string;
}
export declare class AddressDto {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
}
export declare class RegisterDto {
    mobile: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
    dob?: string;
    gender?: string;
    address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
    };
}

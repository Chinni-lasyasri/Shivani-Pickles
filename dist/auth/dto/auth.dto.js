"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = exports.AddressDto = exports.LoginDto = exports.VerifyOtpDto = exports.SendOtpDto = void 0;
const class_validator_1 = require("class-validator");
class SendOtpDto {
    mobile;
}
exports.SendOtpDto = SendOtpDto;
__decorate([
    (0, class_validator_1.IsMobilePhone)('en-IN', {}, { message: 'Enter a valid Indian mobile number' }),
    __metadata("design:type", String)
], SendOtpDto.prototype, "mobile", void 0);
class VerifyOtpDto {
    mobile;
    otp;
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, class_validator_1.IsMobilePhone)('en-IN', {}, { message: 'Enter a valid Indian mobile number' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "mobile", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6, { message: 'OTP must be 6 digits' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "otp", void 0);
class LoginDto {
    mobile;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsMobilePhone)('en-IN', {}, { message: 'Enter a valid Indian mobile number' }),
    __metadata("design:type", String)
], LoginDto.prototype, "mobile", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class AddressDto {
    line1;
    line2;
    city;
    state;
    pincode;
}
exports.AddressDto = AddressDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "line1", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "line2", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'Enter a valid 6-digit pincode' }),
    __metadata("design:type", String)
], AddressDto.prototype, "pincode", void 0);
class RegisterDto {
    mobile;
    password;
    firstName;
    lastName;
    email;
    dob;
    gender;
    address;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsMobilePhone)('en-IN', {}, { message: 'Enter a valid Indian mobile number' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "mobile", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters' }),
    (0, class_validator_1.Matches)(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' }),
    (0, class_validator_1.Matches)(/(?=.*\d)/, { message: 'Password must contain at least one number' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "dob", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['male', 'female', 'other', 'prefer_not_to_say']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], RegisterDto.prototype, "address", void 0);
//# sourceMappingURL=auth.dto.js.map
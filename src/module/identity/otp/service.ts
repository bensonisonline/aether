import { UserRepository } from "@/module/identity/repository/user";
import { HttpStatus } from "@/shared/http-status";
import {
    BadRequestError,
    ConflictError,
    SuccessResponse,
} from "@/shared/responses";
import { otp } from "./repository";
import { sendEmail } from "@/pkg/mailer/sendEmail";
import { formatOtpStrict } from "@/shared/utils";

const RESEND_COOLDOWN_SECONDS = Number(Bun.env.OTP_RESEND_COOLDOWN) || 300;

class OTPService {
    private userRepo: UserRepository;

    constructor() {
        this.userRepo = new UserRepository();
    }

    async sendEmailOtp(email: string, ip?: string, userAgent?: string) {
        const emailExist = await this.userRepo.findUserByEmail(email);
        if (emailExist)
            throw new ConflictError(
                "This email belongs to an existing account",
            );

        const canResend = await otp.canResend(email, RESEND_COOLDOWN_SECONDS);
        if (!canResend) {
            throw new BadRequestError(
                "Please wait before requesting a new OTP",
            );
        }
        const newOtp = otp.generate();

        await otp.set(email, newOtp, "verification");
        await otp.markResent(email);
        otp.log({
            identifier: email,
            channel: "email",
            event: "generated",
            ip,
            userAgent,
        });

        await sendEmail("otp", email, "Your Aether Verification Code", {
            code: formatOtpStrict(newOtp),
        });
        return SuccessResponse(HttpStatus.OK, "OTP was sent successfully", {});
    }

    async verifyEmail(
        email: string,
        inputOtp: string,
        ip?: string,
        userAgent?: string,
    ) {
        const storedOtp = await otp.get(email, "verification");
        if (!storedOtp || storedOtp !== inputOtp) {
            otp.log({
                identifier: email,
                channel: "email",
                event: "failed",
                ip,
                userAgent,
            });
            throw new BadRequestError(
                "Invalid OTP or OTP expired. Request a new one.",
            );
        }

        await otp.delete(email, "verification");
        otp.log({
            identifier: email,
            channel: "email",
            event: "verified",
            ip,
            userAgent,
        });
        return SuccessResponse(
            HttpStatus.OK,
            "Email verified successfully",
            {},
        );
    }

    async resend(identifier: string) {
        await this.sendEmailOtp(identifier);
        return SuccessResponse(HttpStatus.OK, "OTP resent successfully", {});
    }
}

export const otpService = new OTPService();

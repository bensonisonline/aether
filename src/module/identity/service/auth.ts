import { publishUserCreated } from "@/module/identity/event";
import { OtpRepository } from "@/module/identity/otp/repository";
import type { IAuthUser } from "@/module/identity/types";
import { log } from "@/pkg/log";
import { sendEmail } from "@/pkg/mailer/sendEmail";
import { Events } from "@/shared/event-enum";
import { HttpStatus } from "@/shared/http-status";
import {
    BadRequestError,
    InternalServerError,
    NotFoundError,
    SuccessResponse,
} from "@/shared/responses";
import { formatOtpStrict } from "@/shared/utils";
import { AuthRepository } from "../repository/auth";
import { UserRepository } from "../repository/user";
import { verifyGoogleIdToken } from "../utils";

export class AuthService {
    private authRepo: AuthRepository;
    private userRepo: UserRepository;
    private otp: OtpRepository;

    constructor() {
        this.authRepo = new AuthRepository();
        this.userRepo = new UserRepository();
        this.otp = new OtpRepository();
    }

    createUser = async (u: IAuthUser) => {
        const existingUserEmail = await this.userRepo.findUserByEmail(u.email);
        if (existingUserEmail)
            throw new BadRequestError(
                "This email belongs to an existing account",
            );
        const { user, accessToken } = await this.authRepo.createUser(u);

        log.info({
            event: Events.CREATED,
            message: "A new user has been created",
            userId: user.id,
        });

        const jobId = crypto.randomUUID();
        await publishUserCreated(user.id, {
            jobId,
            name: u.name,
        });

        return SuccessResponse(
            HttpStatus.CREATED,
            "Account created successfully.",
            { accessToken },
        );
    };
    sendLoginVerification = async (email: string) => {
        const user = await this.userRepo.findUserByEmail(email);
        if (!user)
            throw new NotFoundError("The account with is email is not found");

        const canResend = await this.otp.canResend(email, 300);
        if (!canResend) {
            throw new BadRequestError(
                "Please wait before requesting a new OTP",
            );
        }
        const token = this.otp.generate(6);

        await this.otp.set(`${email}`, token, "login", 600);
        await this.otp.markResent(email);
        this.otp.log({
            identifier: email,
            channel: "email",
            event: "generated",
        });
        await sendEmail("login", email, "Your Aether Login Code", {
            code: formatOtpStrict(token),
        });
        return SuccessResponse(HttpStatus.OK, "OTP was sent successfully", {});
    };

    verifyLogin = async (email: string, otp: string, fingerprint: string) => {
        const stored = await this.otp.get(`${email}`, "login");

        if (!stored || stored !== otp) {
            await this.otp.log({
                identifier: email,
                channel: "email",
                event: "failed",
            });
            throw new BadRequestError(
                "Invalid OTP or OTP expired. Request a new one.",
            );
        }

        await this.otp.delete(`${email}`, "login");
        await this.otp.log({
            identifier: email,
            channel: "email",
            event: "verified",
        });
        const user = await this.userRepo.findUserByEmail(email);
        const profile = await this.userRepo.getUserAndProfile(user.id);

        const { accessToken } = await this.authRepo.completeLogin({
            id: profile.users.id,
            name: profile.users.name,
            email: profile.users.email,
            status: profile.users.status,
            fingerprint,
            avatarUrl: profile.profiles?.avatarUrl!,
        });
        return SuccessResponse(
            HttpStatus.OK,
            "Login was successful. Welcome onboard",
            { accessToken },
        );
    };

    async google(
        code: string,
        fingerprint: string,
        platform: "mobile" | "browser" = "mobile",
    ) {
        try {
            if (!code) throw new BadRequestError("Authentication code missing");

            let decoded;

            try {
                decoded = await verifyGoogleIdToken(code);
            } catch (error) {
                throw new BadRequestError("Invalid token");
            }

            if (!decoded) throw new BadRequestError("Invalid token");

            const { email, name, picture } = decoded;

            if (!email) throw new BadRequestError("No email in google token");

            // Find or create user
            const user = await this.userRepo.findUserByEmail(email!);
            if (!user) {
                const { user: newUser, accessToken } =
                    await this.authRepo.createUser({
                        email: email!,
                        name: name!,
                        platform,
                        fingerprint,
                    });

                log.info({
                    event: Events.CREATED,
                    message: "A new user has been created",
                    userId: newUser.id,
                });

                const jobId = crypto.randomUUID();
                await publishUserCreated(newUser.id, {
                    jobId,
                    name,
                    picture,
                });

                return SuccessResponse(
                    HttpStatus.OK,
                    "Account created successfully.",
                    { accessToken },
                );
            } else {
                const { accessToken } = await this.authRepo.completeLogin({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    status: user.status,
                    fingerprint,
                    avatarUrl: picture!,
                });

                return SuccessResponse(
                    HttpStatus.OK,
                    "Login was successful. Welcome onboard",
                    { accessToken },
                );
            }
        } catch (error: any) {
            log.error({
                event: Events.AUTH_FAILED,
                message: error.message,
                error: error.stack,
            });
            throw new InternalServerError(
                `Failed to authenticate with Google: ${error.message}`,
            );
        }
    }
}

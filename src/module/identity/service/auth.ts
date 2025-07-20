import { publishUserCreated } from "@/module/identity/event";
import { OtpRepository } from "@/module/identity/otp/repository";
import type { IAuthUser, ILogin } from "@/module/identity/types";
import { Crypto as Hashing, sanitizeUser } from "@/module/identity/utils";
import { log } from "@/pkg/log";
import { Events } from "@/shared/event-enum";
import { HttpStatus } from "@/shared/http-status";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    SuccessResponse,
    UnauthorizedError,
} from "@/shared/responses";
import { AuthRepository } from "../repository/auth";
import { SessionRepository } from "../repository/session";
import { UserRepository } from "../repository/user";

export class AuthService {
    private authRepo: AuthRepository;
    private userRepo: UserRepository;
    private session: SessionRepository;
    private otp: OtpRepository;
    private hash: Hashing;

    constructor() {
        this.authRepo = new AuthRepository();
        this.userRepo = new UserRepository();
        this.session = new SessionRepository();
        this.otp = new OtpRepository();
        this.hash = new Hashing();
    }

    createUser = async (u: IAuthUser) => {
        const existingUserEmail = await this.userRepo.findUserByEmail(u.email);
        if (existingUserEmail)
            throw new BadRequestError(
                "This email belongs to an existing account",
            );

        const passwordHash = await this.hash.hash(u.passwordHash);
        const { user, accessToken } = await this.authRepo.createUser({
            ...u,
            passwordHash,
        });

        log.info({
            event: Events.CREATED,
            message: "A new user has been created",
            userId: user.id,
        });

        const jobId = crypto.randomUUID();
        await publishUserCreated(user.id, {
            jobId,
            firstName: u.firstName,
            lastName: u.lastName,
        });

        return SuccessResponse(
            HttpStatus.CREATED,
            "Account created successfully.",
            {
                user: sanitizeUser(user),
                accessToken,
            },
        );
    };
    sendLoginVerification = async (email: string) => {
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
        // TODO: create login send verification
        return SuccessResponse(HttpStatus.OK, "OTP was sent successfully", {});
    };

    verifyDeviceLogin = async (email: string, otp: string) => {
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
        if (!user)
            throw new NotFoundError("The account with is email is not found");

        const { accessToken } = await this.authRepo.completeLogin({
            id: user.id,
            email: user.email,
            status: user.status,
        });
        return SuccessResponse(HttpStatus.OK, "Device verified successfully", {
            user: sanitizeUser(user),
            accessToken,
        });
    };

    login = async (data: ILogin) => {
        const user = await this.userRepo.findUserByEmail(data.email);
        if (!user) throw new NotFoundError("Your account was not found.");

        if (user.status === "suspended")
            throw new UnauthorizedError(
                "Your account was suspended. Please contact support",
            );

        const valid = await this.hash.verify(
            user.passwordHash,
            data.passwordHash,
        );
        if (!valid) {
            this.session.updateLoginAttempt(user.id);
            const { loginAttempts } = await this.session.getLoginAttempts(
                user.id,
            );
            if (loginAttempts >= 5) {
                // TODO: send an account suspension email
                this.session.revokeAllSessions(user.id);
                this.userRepo.userUpdate(user.id, { status: "suspended" });
                throw new ForbiddenError(
                    "You have exceeded your login attempts. Your account has been locked. Contact support.",
                );
            }
            throw new BadRequestError(
                `Incorrect password. You have ${5 - loginAttempts} attempts before your account is suspended.`,
            );
        } else {
            this.session.resetLoginAttempt(user.id);
        }

        const { status } = await this.session.compareDevice(
            user.id,
            data.fingerprint,
            data.platform,
        );

        if (status === "known") {
            await this.session.updateLastLogin(user.id);
            const { accessToken } = await this.authRepo.completeLogin({
                id: user.id,
                email: user.email,
                status: user.status,
                fingerprint: data.fingerprint,
            });

            return SuccessResponse(
                HttpStatus.OK,
                "Login was successful. Welcome onboard.",
                {
                    user: sanitizeUser(user),
                    accessToken,
                },
            );
        }

        if (status === "new" || status === "challenge") {
            if (data.platform === "mobile") {
                return SuccessResponse(
                    HttpStatus.FOUND,
                    "New mobile phone detected. Follow the steps to login.",
                    {},
                );
            }

            if (data.platform === "browser") {
                await this.sendLoginVerification(user.email);
                return SuccessResponse(
                    HttpStatus.FOUND,
                    "New browser detected. Follow the steps to login.",
                    {},
                );
            }

            throw new ForbiddenError("You cannot log in with this device");
        }

        throw new UnauthorizedError("Login failed unexpectedly. Try again");
    };

    // biometricLogin = async (token: string) => {
    //     const { userId } = await this.session.validateRefresh(token);
    //     const user = await this.userRepo.findUserById(userId);
    //     const { status } = await this.userRepo.getUserStatus(user!.id);

    //     if (status === "closed")
    //         throw new UnauthorizedError(
    //             "Your account was closed. You are not allowed to login. Contact support",
    //         );
    //     if (status === "suspended")
    //         throw new UnauthorizedError(
    //             "Your account was closed. You are not allowed to login. Contact support",
    //         );

    //     const { accessToken, refreshToken } = await this.authRepo.completeLogin(
    //         {
    //             id: user.id,
    //             email: user.email,
    //             role: user.role,
    //             status: user.status,
    //         },
    //     );

    //     return SuccessResponse(HttpStatus.OK, "Login was successful", {
    //         user,
    //         accessToken,
    //         refreshToken,
    //     });
    // };
}

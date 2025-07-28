import { publishUserCreated } from "@/module/identity/event";
import { OtpRepository } from "@/module/identity/otp/repository";
import type { IAuthUser } from "@/module/identity/types";
import { Crypto as Hashing } from "@/module/identity/utils";
import { log } from "@/pkg/log";
import { sendEmail } from "@/pkg/mailer/sendEmail";
import { Events } from "@/shared/event-enum";
import { HttpStatus } from "@/shared/http-status";
import {
    BadRequestError,
    NotFoundError,
    SuccessResponse,
} from "@/shared/responses";
import { AuthRepository } from "../repository/auth";
import { SessionRepository } from "../repository/session";
import { UserRepository } from "../repository/user";
import { formatOtpStrict } from "@/shared/utils";

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

    verifyLogin = async (email: string, otp: string) => {
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

        const { accessToken } = await this.authRepo.completeLogin({
            id: user.id,
            email: user.email,
            status: user.status,
        });
        return SuccessResponse(
            HttpStatus.OK,
            "Login was successful. Welcome onboard",
            { accessToken },
        );
    };
}

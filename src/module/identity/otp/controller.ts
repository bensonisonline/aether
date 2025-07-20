import { getRequestContext } from "@/context/async";
import { Router, type Request, type Response } from "express";
import { otpService } from "./service";
import { emailSchema, otpVerification } from "../validators";
import { HttpStatus } from "@/shared/http-status";

export const router = Router()
    .post("/send/email", async (req: Request, res: Response) => {
        const userAgent = getRequestContext()?.userAgent;
        const ip = getRequestContext()?.ip;

        const { email } = req.body;
        const parse = emailSchema.safeParse(email);
        if (!parse.success) {
            return res.status(HttpStatus.BAD_REQUEST).send(parse.error.message);
        }
        const response = await otpService.sendEmailOtp(email, ip, userAgent);
        return res.status(response.status).send(response);
    })
    .post("/verify/email", async (req: Request, res: Response) => {
        const userAgent = getRequestContext()?.userAgent;
        const ip = getRequestContext()?.ip;

        const { email, otp } = req.body;
        const parse = otpVerification.safeParse({ email, otp });
        if (!parse.success) {
            return res.status(HttpStatus.BAD_REQUEST).send(parse.error.flatten);
        }
        const response = await otpService.verifyEmail(
            email,
            otp,
            ip,
            userAgent,
        );
        return res.status(response.status).send(response);
    })
    .post("/resend", async (req: Request, res: Response) => {
        const response = await otpService.resend(req.body.identifier);
        return res.status(response.status).send(response);
    });

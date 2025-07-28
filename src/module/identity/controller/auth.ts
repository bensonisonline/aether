import type { Request, Response } from "express";
import { AuthService } from "../service/auth";
import { getRequestContext } from "@/context/async";

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response) {
        const ctx = getRequestContext();
        const platform = ctx!.platform;
        const result = await authService.createUser({ ...req.body, platform });

        res.status(result.status).send(result);
    }

    async googleAuth(req: Request, res: Response) {
        const ctx = getRequestContext();
        const platform = ctx!.platform;
        const { code, redirectURI, codeVerifier, fingerprint } = req.body;
        const result = await authService.google(code, redirectURI, codeVerifier, fingerprint, platform);

        return res.status(result.status).send(result);
    }

    async otpLogin(req: Request, res: Response) {
        const { email } = req.body;
        const response = await authService.sendLoginVerification(email);
        return res.status(response.status).send(response);
    }
    async verifyLogin(req: Request, res: Response) {
        const { email, otp } = req.body;
        const response = await authService.verifyLogin(email, otp);
        return res.status(response.status).send(response);
    }
}

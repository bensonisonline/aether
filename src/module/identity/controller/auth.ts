import type { Request, Response } from "express";
import { AuthService } from "../service/auth";
import { getRequestContext } from "@/context/async";

const authService = new AuthService();

export class AuthController {
    private readonly service: AuthService;
    constructor() {
        this.service = new AuthService();
    }

    async register(req: Request, res: Response) {
        const ctx = getRequestContext();
        const platform = ctx!.platform;
        const result = await authService.createUser({ ...req.body, platform });

        res.status(result.status).send(result);
    }

    async login(req: Request, res: Response) {
        const ctx = getRequestContext();
        const platform = ctx!.platform;
        const response = await authService.login({ ...req.body, platform });
        return res.status(response.status).send(response);
    }

    // async biometricLogin(req: Request, res: Response) {
    //     const { token } = req.body;
    //     const response = await authService.biometricLogin(token);
    //     return res.status(response.status).send(response);
    // }

    async otpLogin(req: Request, res: Response) {
        const { email } = req.body;
        const response = await authService.sendLoginVerification(email);
        return res.status(response.status).send(response);
    }
    async verifyLogin(req: Request, res: Response) {
        const { email, otp } = req.body;
        const response = await authService.verifyDeviceLogin(email, otp);
        return res.status(response.status).send(response);
    }
}

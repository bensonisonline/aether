import { getJWKS } from "./utils";
import { router as otpController } from "./otp/controller";
import { Router, type Request, type Response } from "express";
import { AuthController } from "./controller/auth";

const auth = new AuthController();

export const router = Router()
    .get("/.well-known", (_req: Request, res: Response) => {
        const jwks = getJWKS();
        return res.status(200).send(jwks);
    })
    .post("/register", auth.register)
    .post("/login", auth.login)
    // .post("/login/biometric", auth.biometricLogin)
    .post("/login/otp", auth.otpLogin)
    .post("/verify/otp", auth.verifyLogin)
    .use(otpController);

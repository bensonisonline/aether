import { getJWKS } from "./utils";
import { router as otpController } from "./otp/controller";
import { Router, type Request, type Response } from "express";
import { AuthController } from "./controller/auth";

const auth = new AuthController();

export const authRouter = Router()
    .get("/.well-known", (_req: Request, res: Response) => {
        const jwks = getJWKS();
        return res.status(200).send(jwks);
    })
    .post("/register", auth.register)
    .post("/login/otp", auth.otpLogin)
    .post("/login/verify", auth.verifyLogin)
    .use(otpController);

export const userRouter = Router();

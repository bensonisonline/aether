import { SuccessResponse } from "../shared/responses";
import { HttpStatus } from "../shared/http-status";
import { Router, type Request, type Response } from "express";
// import { router as users } from "@/modules/identity/users/router";
import { authRouter } from "@/module/identity/router";
import { router as chat } from "@/module/chat/router/chat";

export const router = Router();

router
    .get("/health", async (req: Request, res: Response) => {
        const result = SuccessResponse(HttpStatus.OK, "Healthy", {
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
        return res.status(HttpStatus.OK).send(result);
    })
    // .use("/users", users)
    .use("/auth", authRouter)
    .use("/chat", chat);

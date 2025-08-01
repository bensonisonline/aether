import { Router } from "express";
// import { router as users } from "@/modules/identity/users/router";
import { router as chat } from "@/module/chat/router/chat";
import { authRouter } from "@/module/identity/router";

export const router = Router();

router
    // .use("/users", users)
    .use("/auth", authRouter)
    .use("/chat", chat);

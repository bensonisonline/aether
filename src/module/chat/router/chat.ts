import { Router } from "express";
import { ChatController } from "../controller/chat";
import { authenticate } from "@/middleware/auth";

const controller = new ChatController();
export const router = Router();

router
    .use(authenticate)
    // Create new session with streaming
    .post("/sessions", controller.createSession)

    // Add message to existing session
    .post("/sessions/:sessionId/messages", controller.addMessage)

    // Get session messages
    .get("/sessions/:sessionId/messages", controller.getSessionMessages)

    // Get user sessions
    .get("/sessions", controller.getUserSessions);

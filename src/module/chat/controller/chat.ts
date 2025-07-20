import type { Request, Response } from "express";
import { ChatService } from "../service/chat";
import { getRequestContext } from "@/context/async";
import { UnauthorizedError } from "@/shared/responses";
import { log } from "@/pkg/log";
import { ChatHistoryRepository } from "../repository/chat-history";
import { PromptRepository } from "../repository/prompt";
import type { Key } from "../repository/prompt";
export class ChatController {
    createSession = async (req: Request, res: Response) => {
        const startTime = Date.now();
        let heartbeat: NodeJS.Timeout | null = null;
        const userId = getRequestContext()?.user?.id;

        try {
            if (!userId)
                throw new UnauthorizedError("Unauthorized: Please login");

            const { promptKey, message, additionalContext } = req.body;
            if (!promptKey || !message) {
                return res
                    .status(400)
                    .json({ error: "Missing required fields" });
            }

            // Check if client supports SSE
            const acceptsSSE =
                req.headers.accept?.includes("text/event-stream") ||
                req.headers["x-client"] === "expo";

            // Create session with enhanced context support
            const { data } = await ChatService.createSession(
                userId,
                promptKey,
                message,
                additionalContext,
            );

            // Setup headers based on streaming mode
            if (acceptsSSE) {
                res.setHeader("Content-Type", "text/event-stream");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("Connection", "keep-alive");
                res.setHeader("X-Accel-Buffering", "no");
                res.flushHeaders();

                // Keep connection alive
                heartbeat = setInterval(() => {
                    if (!res.writableEnded) res.write(": heartbeat\n\n");
                    else if (heartbeat) clearInterval(heartbeat);
                }, 15000);
            }

            let fullResponse = "";
            let isErrored = false;

            try {
                // Use enhanced streaming with context templating
                const stream = ChatService.streamResponse(
                    data.session.id,
                    data.prompt.prompt.systemPrompt,
                    data.prompt.prompt.contextTemplate,
                    data.prompt.prompt.taskInstructions,
                    data.prompt.model,
                    message,
                    userId,
                    additionalContext,
                );

                for await (const chunk of stream) {
                    fullResponse += chunk;

                    if (acceptsSSE) {
                        try {
                            res.write(
                                `data: ${JSON.stringify({ text: chunk })}\n\n`,
                            );
                        } catch (writeError) {
                            log.warn({
                                event: "CLIENT_DISCONNECTED",
                                sessionId: data.session.id,
                                message:
                                    "Client closed connection during streaming",
                            });
                            break;
                        }
                    }
                }
            } catch (streamError) {
                isErrored = true;
                log.error({
                    event: "STREAM_ERROR",
                    message: "Streaming failed",
                    error:
                        streamError instanceof Error
                            ? streamError.message
                            : String(streamError),
                    sessionId: data.session.id,
                    duration: Date.now() - startTime,
                });
            }

            // Save response
            if (!isErrored && fullResponse) {
                try {
                    await ChatService.saveAssistantResponse(
                        data.session.id,
                        fullResponse,
                        message,
                    );
                } catch (saveError) {
                    log.error({
                        event: "ASSISTANT_SAVE_FAILED",
                        message: "Failed to save assistant response",
                        error:
                            saveError instanceof Error
                                ? saveError.message
                                : String(saveError),
                        sessionId: data.session.id,
                    });
                }
            }

            // If not SSE, return full response as JSON
            if (!acceptsSSE) {
                return res.status(200).json({
                    sessionId: data.session.id,
                    prompt: data.prompt.key,
                    response: fullResponse,
                });
            }

            log.info({
                event: "SESSION_COMPLETED",
                sessionId: data.session.id,
                duration: Date.now() - startTime,
                responseLength: fullResponse.length,
                success: !isErrored,
            });
        } catch (error: any) {
            log.error({
                event: "SESSION_CREATION_FAILED",
                message: "Session creation failed",
                error: error.message,
                userId,
            });

            if (!res.headersSent) {
                res.status(500).json({ error: error.message });
            }
        } finally {
            if (heartbeat) clearInterval(heartbeat);
            if (!res.writableEnded) res.end();
        }
    };

    addMessage = async (req: Request, res: Response) => {
        const startTime = Date.now();
        let heartbeat: NodeJS.Timeout | null = null;
        const userId = getRequestContext()?.user?.id;

        try {
            if (!userId)
                throw new UnauthorizedError("Unauthorized: Please login");

            const { sessionId } = req.params;
            const { message, additionalContext } = req.body;
            if (!message) {
                return res.status(400).json({ error: "Message is required" });
            }

            // Ensure session exists and belongs to user
            const session = await ChatService.getSession(sessionId, userId);
            if (!session) {
                return res
                    .status(403)
                    .json({ error: "Unauthorized or session not found" });
            }

            // Get the prompt for this session
            const promptRepo = new PromptRepository();
            const prompt = await promptRepo.findByKey(session.promptKey as Key);
            if (!prompt) {
                return res
                    .status(500)
                    .json({ error: "Prompt configuration not found" });
            }

            // Check if client supports SSE
            const acceptsSSE =
                req.headers.accept?.includes("text/event-stream") ||
                req.headers["x-client"] === "expo";

            if (acceptsSSE) {
                res.setHeader("Content-Type", "text/event-stream");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("Connection", "keep-alive");
                res.setHeader("X-Accel-Buffering", "no");
                res.flushHeaders();

                heartbeat = setInterval(() => {
                    if (!res.writableEnded) res.write(": heartbeat\n\n");
                    else if (heartbeat) clearInterval(heartbeat);
                }, 15000);
            }

            // Save user message to DB and Redis
            const userMsg = await ChatService.addMessage(
                sessionId,
                userId,
                "user",
                message,
            );
            await ChatHistoryRepository.addMessage(sessionId, userMsg.data);

            // Stream assistant response with context templating
            let fullResponse = "";
            let isErrored = false;

            try {
                const stream = ChatService.streamResponse(
                    sessionId,
                    prompt.prompt.systemPrompt,
                    prompt.prompt.contextTemplate,
                    prompt.prompt.taskInstructions,
                    prompt.model,
                    message,
                    userId,
                    additionalContext,
                );

                for await (const chunk of stream) {
                    fullResponse += chunk;

                    if (acceptsSSE) {
                        res.write(
                            `data: ${JSON.stringify({ text: chunk })}\n\n`,
                        );
                    }
                }
            } catch (err) {
                isErrored = true;
                log.error({
                    event: "STREAM_ERROR",
                    message: "Assistant response streaming failed",
                    error: err instanceof Error ? err.message : String(err),
                    sessionId,
                    duration: Date.now() - startTime,
                });
            }

            if (!isErrored && fullResponse) {
                await ChatService.saveAssistantResponse(
                    sessionId,
                    fullResponse,
                    message,
                );
            }

            if (!acceptsSSE) {
                return res.status(200).json({
                    sessionId,
                    prompt: session.promptKey,
                    response: fullResponse,
                });
            }

            log.info({
                event: "CONTINUED_SESSION_COMPLETED",
                sessionId,
                duration: Date.now() - startTime,
                responseLength: fullResponse.length,
                success: !isErrored,
            });
        } catch (error: any) {
            log.error({
                event: "ADD_MESSAGE_FAILED",
                error: error.message,
                userId,
            });

            if (!res.headersSent) {
                res.status(500).json({ error: error.message });
            }
        } finally {
            if (heartbeat) clearInterval(heartbeat);
            if (!res.writableEnded) res.end();
        }
    };

    getSessionMessages = async (req: Request, res: Response) => {
        const userId = getRequestContext()?.user?.id;
        if (!userId) throw new UnauthorizedError("Unauthorized: Please login");
        const { sessionId } = req.params;

        const result = await ChatService.getSessionMessages(sessionId, userId);
        return res.status(result.status).send(result);
    };

    getUserSessions = async (_req: Request, res: Response) => {
        const userId = getRequestContext()?.user?.id;
        if (!userId) throw new UnauthorizedError("Unauthorized: Please login");
        const result = await ChatService.getUserSessions(userId);
        return res.status(result.status).send(result);
    };
}

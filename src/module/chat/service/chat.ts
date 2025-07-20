import { db } from "@/infra/db";
import { chatCompletion, type ChatCompletionMessageParam } from "@/infra/groq";
import { ChatMessageRepository } from "../repository/chat-message";
import { ChatSessionRepository } from "../repository/chat-session";
import { chatSessionStarted } from "../event";
import { PromptRepository, type Key } from "../repository/prompt";
import { SuccessResponse } from "@/shared/responses";
import { HttpStatus } from "@/shared/http-status";
import { ChatHistoryRepository } from "../repository/chat-history";
import { log } from "@/pkg/log";
import Mustache from "mustache";
import { UserRepository } from "@/module/identity/repository/user";

const chatMessage = new ChatMessageRepository();
const chatSession = new ChatSessionRepository();
const promptRepo = new PromptRepository();
const userRepo = new UserRepository();

interface UserContext {
    userType: "student" | "worker";
    isStudent: boolean;
    isWorker: boolean;
    level?: string;
    department?: string;
    school?: string;
    industry?: string;
    role?: string;
    organization?: string;
    topic?: string;
}

export const ChatService = {
    async buildUserContext(
        userId: string,
        additionalData?: Record<string, any>,
    ): Promise<UserContext> {
        const user = await userRepo.getUserAndProfile(userId);
        if (!user) throw new Error("User not found");

        const profileType = user.profiles?.type || "student";

        const context: UserContext = {
            userType: profileType,
            isStudent: profileType === "student",
            isWorker: profileType === "worker",
        };

        // Add student-specific context
        if (profileType === "student" && user.profiles) {
            context.level = user.profiles.level ?? undefined;
            context.department = user.profiles.department ?? undefined;
            context.school = user.profiles.school ?? undefined;
        }

        // Add worker-specific context
        if (profileType === "worker" && user.profiles) {
            context.industry = user.profiles.industry ?? undefined;
            context.role = user.profiles.role ?? undefined;
            context.organization = user.profiles.organization ?? undefined;
        }
        if (additionalData) {
            Object.assign(context, additionalData);
        }

        return context;
    },

    renderPromptTemplate(template: string, context: UserContext): string {
        return Mustache.render(template, context);
    },

    async createSession(
        userId: string,
        promptKey: Key,
        userMessage: string,
        additionalContext?: Record<string, any>,
    ) {
        return db.transaction(async (tx) => {
            // Create session
            const session = await chatSession.createWithTx(tx, {
                userId,
                promptKey,
                title: "New Chat",
            });

            // Get prompt configuration
            const prompt = await promptRepo.findByKey(promptKey);
            if (!prompt) throw new Error(`Prompt not found: ${promptKey}`);

            const userContext = await this.buildUserContext(
                userId,
                additionalContext,
            );

            // Render the context template with user data
            const renderedContext = this.renderPromptTemplate(
                prompt.prompt.contextTemplate,
                userContext,
            );

            // Save user message
            const message = await chatMessage.createWithTx(tx, {
                sessionId: session.id,
                role: "user",
                content: userMessage,
            });

            await ChatHistoryRepository.addMessage(session.id, message);

            return SuccessResponse(HttpStatus.OK, "Session created", {
                session,
                prompt: {
                    ...prompt,
                    prompt: {
                        ...prompt.prompt,
                        renderedContext,
                    },
                },
            });
        });
    },

    async *streamResponse(
        sessionId: string,
        systemPrompt: string,
        contextTemplate: string,
        taskInstructions: string,
        model: string,
        userMessage: string,
        userId: string,
        additionalContext?: Record<string, any>,
    ) {
        let history = await ChatHistoryRepository.getHistory(sessionId);

        // Fallback to DB if Redis is empty
        if (history.length === 0) {
            await ChatHistoryRepository.syncFromDatabase(sessionId);
            history = await ChatHistoryRepository.getHistory(sessionId);
        }
        const userContext = await this.buildUserContext(
            userId,
            additionalContext,
        );
        const renderedContext = this.renderPromptTemplate(
            contextTemplate,
            userContext,
        );

        const fullSystemPrompt = `${systemPrompt}CONTEXT:${renderedContext}INSTRUCTIONS:${taskInstructions}`;

        // Convert to message format for LLM
        const messages = [
            { role: "system", content: fullSystemPrompt },
            ...history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            { role: "user", content: userMessage },
        ];

        // Add current user message
        messages.push({ role: "user", content: userMessage });
        let fullResponse = "";
        const stream = chatCompletion(
            model,
            messages as ChatCompletionMessageParam[],
        );

        for await (const chunk of stream) {
            fullResponse = chunk;
            yield chunk;
        }

        return fullResponse;
    },

    async saveAssistantResponse(
        sessionId: string,
        content: string,
        userMessage: string,
    ) {
        try {
            await db.transaction(async (tx) => {
                const assistantMsg = await chatMessage.createWithTx(tx, {
                    sessionId,
                    role: "assistant",
                    content,
                });

                // Add to Redis history
                await ChatHistoryRepository.addMessage(sessionId, assistantMsg);

                // Queue title generation for first interaction
                    await chatSessionStarted(sessionId, userMessage, content);
                
            });
        } catch (error) {
            log.error({
                event: "DB_SAVE_FAILED",
                message: "Failed to save assistant response",
                error: error instanceof Error ? error.message : String(error),
                sessionId,
            });
        }
    },

    async addMessage(
        sessionId: string,
        userId: string,
        role: "user" | "assistant",
        content: string,
    ) {
        const session = await chatSession.findById(sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Session not found or access denied");
        }

        const result = await db.transaction(async (tx) => {
            return chatMessage.createWithTx(tx, {
                sessionId,
                role,
                content,
            });
        });
        return SuccessResponse(HttpStatus.OK, "Message added", result);
    },

    async getSessionMessages(sessionId: string, userId: string) {
        const session = await chatSession.findById(sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Session not found or access denied");
        }
        const result = await chatMessage.findBySessionId(sessionId);
        return SuccessResponse(HttpStatus.OK, "Messages found", result);
    },

    async getSession(sessionId: string, userId: string) {
        const session = await chatSession.findById(sessionId);
        if (!session || session.userId !== userId) return null;
        return session;
    },

    async getUserSessions(userId: string) {
        const result = await chatSession.findByUserId(userId);
        return SuccessResponse(HttpStatus.OK, "Sessions found", result);
    },
};

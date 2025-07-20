import { client } from "@/infra/redis";
import type { ChatMessage } from "../schema/chat";
import { log } from "@/pkg/log";
import { ChatMessageRepository } from "./chat-message";

const HISTORY_TTL = 60 * 60 * 24 * 3; // 3 days TTL
const MAX_HISTORY_LENGTH = 20; // Last 20 messages
const HISTORY_KEY_PREFIX = "chat:history";

const chatMessageRepo = new ChatMessageRepository();

export class ChatHistoryRepository {
    static getKey(sessionId: string): string {
        return `${HISTORY_KEY_PREFIX}:${sessionId}`;
    }

    static async addMessage(
        sessionId: string,
        message: ChatMessage,
    ): Promise<void> {
        try {
            const key = this.getKey(sessionId);
            const value = JSON.stringify({
                id: message.id,
                role: message.role,
                content: message.content,
                createdAt: message.createdAt.toISOString(),
            });

            // Use pipeline for atomic operations
            const pipeline = client.pipeline();
            pipeline.lpush(key, value);
            pipeline.ltrim(key, 0, MAX_HISTORY_LENGTH - 1);
            pipeline.expire(key, HISTORY_TTL);

            await pipeline.exec();

            log.info({
                event: "REDIS_HISTORY_ADDED",
                sessionId,
                messageId: message.id,
            });
        } catch (error) {
            log.error({
                event: "REDIS_ERROR",
                message: "Failed to add message to history",
                error: error instanceof Error ? error.message : String(error),
                sessionId,
            });
        }
    }

    static async getHistory(sessionId: string): Promise<ChatMessage[]> {
        try {
            const key = this.getKey(sessionId);
            const data = await client.lrange(key, 0, -1);

            return data.map((item) => {
                const parsed = JSON.parse(item);
                return {
                    ...parsed,
                    createdAt: new Date(parsed.createdAt),
                    sessionId, // Add sessionId for consistency
                } as ChatMessage;
            });
        } catch (error) {
            log.error({
                event: "REDIS_ERROR",
                message: "Failed to get chat history",
                error: error instanceof Error ? error.message : String(error),
                sessionId,
            });
            return [];
        }
    }

    static async clearHistory(sessionId: string): Promise<void> {
        try {
            await client.del(this.getKey(sessionId));
            log.info({
                event: "REDIS_HISTORY_CLEARED",
                sessionId,
            });
        } catch (error) {
            log.error({
                event: "REDIS_ERROR",
                message: "Failed to clear chat history",
                error: error instanceof Error ? error.message : String(error),
                sessionId,
            });
        }
    }

    static async syncFromDatabase(sessionId: string): Promise<void> {
        try {
            // Get messages from database (implement this in your message repository)
            const dbMessages = await chatMessageRepo.findBySessionId(sessionId);

            if (dbMessages.length === 0) return;

            const pipeline = client.pipeline();
            const key = this.getKey(sessionId);

            // Clear existing and repopulate
            pipeline.del(key);
            dbMessages.slice(-MAX_HISTORY_LENGTH).forEach((msg) => {
                pipeline.lpush(
                    key,
                    JSON.stringify({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        createdAt: msg.createdAt.toISOString(),
                    }),
                );
            });
            pipeline.expire(key, HISTORY_TTL);

            await pipeline.exec();

            log.info({
                event: "REDIS_HISTORY_SYNCED",
                sessionId,
                messageCount: dbMessages.length,
            });
        } catch (error) {
            log.error({
                event: "REDIS_ERROR",
                message: "History sync from DB failed",
                error: error instanceof Error ? error.message : String(error),
                sessionId,
            });
        }
    }
}

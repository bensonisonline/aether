import { eq, count, asc } from "drizzle-orm";
import { db } from "@/infra/db";
import { chatMessage } from "../schema/chat";
import type {
    ChatMessage,
    ChatSession,
    NewChatMessage,
    NewChatSession,
} from "../schema/chat";
import type { Transaction } from "@/infra/db";

export class ChatMessageRepository {
    async createWithTx(tx: Transaction, data: NewChatMessage) {
        const [result] = await tx.insert(chatMessage).values(data).returning();
        if (!result) throw new Error("Failed to create message");
        return result;
    }

    async findBySessionId(sessionId: string) {
        return db
            .select()
            .from(chatMessage)
            .where(eq(chatMessage.sessionId, sessionId))
            .orderBy(asc(chatMessage.createdAt));
    }

    async countBySessionId(sessionId: string) {
        const result = await db
            .select({ count: count() })
            .from(chatMessage)
            .where(eq(chatMessage.sessionId, sessionId));

        return result[0]?.count || 0;
    }

    async deleteBySessionId(sessionId: string) {
        await db
            .delete(chatMessage)
            .where(eq(chatMessage.sessionId, sessionId));
    }
}

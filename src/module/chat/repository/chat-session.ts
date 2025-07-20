import type { Transaction } from "@/infra/db";
import { db } from "@/infra/db";
import { and, desc, eq } from "drizzle-orm";
import type { NewChatSession } from "../schema/chat";
import { chatSession } from "../schema/chat";

export class ChatSessionRepository {
    async createWithTx(tx: Transaction, data: NewChatSession) {
        const [result] = await tx.insert(chatSession).values(data).returning();
        if (!result) throw new Error("Failed to create session");
        return result;
    }

    async findById(id: string) {
        const [result] = await db
            .select()
            .from(chatSession)
            .where(eq(chatSession.id, id))
            .limit(1);
        return result || null;
    }

    async findByUserId(userId: string) {
        return db
            .select()
            .from(chatSession)
            .where(eq(chatSession.userId, userId))
            .orderBy(desc(chatSession.updatedAt));
    }

    async updateTitle(id: string, title: string) {
        const [result] = await db
            .update(chatSession)
            .set({
                title,
                updatedAt: new Date(),
            })
            .where(eq(chatSession.id, id))
            .returning();
        return result || null;
    }

    async delete(id: string, userId: string) {
        await db
            .delete(chatSession)
            .where(and(eq(chatSession.id, id), eq(chatSession.userId, userId)));
    }
}

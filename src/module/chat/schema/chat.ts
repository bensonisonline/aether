import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const chatSession = pgTable("chat_sessions", {
    id: uuid().primaryKey().defaultRandom().notNull(),
    userId: uuid().notNull(),
    promptKey: text().notNull(),
    model: varchar({
        enum: ["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768"],
    })
        .notNull()
        .default("llama3-70b-8192"),
    title: varchar({ length: 100 }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const chatMessage = pgTable("chat_messages", {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
        .notNull()
        .references(() => chatSession.id, { onDelete: "cascade" }),
    role: varchar({ enum: ["user", "assistant"] }).notNull(),
    content: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
});

export type ChatSession = typeof chatSession.$inferSelect;
export type NewChatSession = typeof chatSession.$inferInsert;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;

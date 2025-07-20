import {
    pgTable,
    uuid,
    text,
    jsonb,
    boolean,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

export interface PromptData {
    systemPrompt: string;
    contextTemplate: string;
    taskInstructions: string;
}

export const prompts = pgTable("ai_prompts", {
    id: uuid().primaryKey().defaultRandom(),
    key: varchar({
        enum: [
            "TUTOR",
            "RESUME_WRITER",
            "LAB_ASSISTANT",
            "EXAM_PREP",
            "COURSE_BUILDER",
        ],
        length: 30,
    })
        .default("TUTOR")
        .notNull()
        .unique(),
    name: varchar().notNull(),
    description: text(),
    model: varchar({ length: 100 }).notNull().default("llama3-70b-8192"),
    capability: varchar({ length: 100 }).notNull(), // "resume_building", "course_builder", etc.
    outputType: text({ enum: ["text", "pdf", "markdown", "json"] })
        .notNull()
        .default("text"),

    prompt: jsonb().$type<PromptData>().notNull(),
    isUserEditable: boolean().default(false),
    createdBy: uuid(), // null for system prompt
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
});

export type Prompts = typeof prompts.$inferSelect;

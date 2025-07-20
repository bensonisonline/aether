import { db } from "@/infra/db";
import { prompts } from "../schema/prompt";
import { eq } from "drizzle-orm";

export type Key =
    | "TUTOR"
    | "RESUME_WRITER"
    | "LAB_ASSISTANT"
    | "EXAM_PREP"
    | "COURSE_BUILDER";

export class PromptRepository {
    async findByKey(key: Key) {
        const [result] = await db
            .select()
            .from(prompts)
            .where(eq(prompts.key, key))
            .limit(1);
        return result || null;
    }

    async listAll() {
        return await db.select().from(prompts);
    }
}

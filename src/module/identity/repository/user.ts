import { db } from "@/infra/db";
import { user, type User } from "../schema/user";
import { eq } from "drizzle-orm";
import { profile } from "../schema/profile";

export class UserRepository {
    async findUserById(id: string): Promise<User | null> {
        const [record] = await db.select().from(user).where(eq(user.id, id));
        return record ?? null;
    }

    async findUserByEmail(email: string) {
        const [record] = await db
            .select()
            .from(user)
            .where(eq(user.email, email));
        return record ?? null;
    }

    async getUserStatus(id: string): Promise<{ status: string }> {
        const [status] = await db
            .select({ status: user.status })
            .from(user)
            .where(eq(user.id, id));
        return status;
    }

    async userUpdate(id: string, updates: Partial<User>): Promise<User | null> {
        const [update] = await db
            .update(user)
            .set(updates)
            .where(eq(user.id, id))
            .returning();
        return update ?? null;
    }
    async getUserAndProfile(userId: string) {
        const result = await db
            .select()
            .from(user)
            .leftJoin(profile, eq(user.id, profile.userId))
            .where(eq(user.id, userId));

        if (result.length === 0) {
            throw new Error(`User not found: ${userId}`);
        }

        return result[0];
    }
}

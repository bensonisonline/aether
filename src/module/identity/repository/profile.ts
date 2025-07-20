import { db } from "@/infra/db";
import { and, eq, sql } from "drizzle-orm";
import { profile, usernameChange, type Profile } from "../schema/profile";

export class ProfileRepository {
    createProfile(
        userId: string,
        username: string,
        firstName: string,
        lastName: string,
    ) {
        return db
            .insert(profile)
            .values({ userId, username, firstName, lastName });
    }
    async findById(id: string) {
        const [record] = await db
            .select()
            .from(profile)
            .where(eq(profile.id, id));
        return record ?? null;
    }

    async findByUserId(userId: string) {
        const [record] = await db
            .select()
            .from(profile)
            .where(eq(profile.userId, userId));
        return record ?? null;
    }

    async findByUserName(username: string) {
        const [record] = await db
            .select()
            .from(profile)
            .where(eq(profile.username, username));
        return record ?? null;
    }

    async update(
        id: string,
        updates: Partial<Profile>,
    ): Promise<Profile | null> {
        const [updated] = await db
            .update(profile)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(profile.id, id))
            .returning();
        return updated ?? null;
    }

    /**
     * Log the username change event
     */
    async logUsernameChange({
        profileId,
        oldUsername,
        newUsername,
    }: {
        profileId: string;
        oldUsername: string;
        newUsername: string;
    }) {
        await db.insert(usernameChange).values({
            profileId,
            oldUsername,
            newUsername,
            changedAt: new Date(),
        });
    }

    /**
     * Optional: Check if the user changed username in the last 24 hours
     */
    async hasChangedUsernameRecently(profileId: string): Promise<boolean> {
        const [record] = await db
            .select()
            .from(usernameChange)
            .where(
                and(
                    eq(usernameChange.profileId, profileId),
                    sql`${usernameChange.changedAt} > NOW() - INTERVAL '1 day'`,
                ),
            );
        return !!record;
    }
}

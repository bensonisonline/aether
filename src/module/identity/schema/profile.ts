import {
    boolean,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user";

export const profile = pgTable(
    "profiles",
    {
        id: uuid().primaryKey().defaultRandom(),
        userId: uuid()
            .unique()
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),

        //   profile fields
        username: varchar({ length: 50 }).notNull().unique(),
        firstName: varchar({ length: 100 }).notNull(),
        lastName: varchar({ length: 100 }).notNull(),
        avatarUrl: text(),
        bio: text(),

        // academic
        type: varchar({ enum: ["student", "worker"] })
            .default("student")
            .notNull(),
        school: varchar({ length: 100 }),
        department: varchar({ length: 100 }),
        level: varchar({ length: 100 }),
        matricNumber: varchar({ length: 100 }),

        organization: varchar({ length: 100 }),
        industry: varchar({ length: 100 }),
        role: varchar({ length: 100 }),

        // privacy
        isPrivate: boolean().default(false),

        // timestamps
        createdAt: timestamp({ withTimezone: true }).defaultNow(),
        updatedAt: timestamp({ withTimezone: true }).defaultNow(),
    },
    (t) => [uniqueIndex("username_idx").on(t.username)],
);

export const usernameChange = pgTable("username_changes", {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid().notNull(),
    oldUsername: varchar({ length: 32 }).notNull(),
    newUsername: varchar({ length: 32 }).notNull(),
    changedAt: timestamp({ withTimezone: true }).defaultNow(),
});

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;

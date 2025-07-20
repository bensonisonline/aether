import {
    boolean,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user";

export const session = pgTable(
    "sessions",
    {
        id: uuid().primaryKey().defaultRandom(),
        userId: uuid()
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        fingerprint: text().notNull(),
        platform: varchar({ enum: ["mobile", "browser"] }).notNull(),
        provider: varchar({ enum: ["local", "google"] })
            .default("local")
            .notNull(),
        lastLogin: timestamp({ withTimezone: true }),
        loginAttempts: integer().default(0).notNull(),
        isActive: boolean().default(true).notNull(),

        revoked: boolean().default(false).notNull(),
        expiresAt: timestamp({ withTimezone: true }).notNull(),
        createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [uniqueIndex("user_fingerprint_idx").on(t.userId, t.fingerprint)],
);

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

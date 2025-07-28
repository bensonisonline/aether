import {
    pgTable,
    timestamp,
    uuid,
    varchar,
    uniqueIndex,
    boolean,
} from "drizzle-orm/pg-core";

export const user = pgTable(
    "users",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        email: varchar({ length: 255 }).notNull().unique(),
        isSuperUser: boolean().default(false),
        gender: varchar({ enum: ["male", "female"] }),
        dateOfBirth: timestamp({ withTimezone: true }),
        status: varchar({ enum: ["active", "suspended"] })
            .notNull()
            .default("active"),
        isVerified: boolean().default(false),
        createdAt: timestamp({ withTimezone: true }).defaultNow(),
        updatedAt: timestamp({ withTimezone: true }).defaultNow(),
    },
    (t) => [uniqueIndex("email_idx").on(t.email)],
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

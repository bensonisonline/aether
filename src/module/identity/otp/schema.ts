import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const otpLog = pgTable("otp_logs", {
    id: uuid().defaultRandom().primaryKey(),
    identifier: varchar().notNull(),
    channel: varchar().notNull(),
    event: varchar().notNull(),
    ip: varchar(),
    userAgent: varchar(),
    createdAt: timestamp().defaultNow().notNull(),
});

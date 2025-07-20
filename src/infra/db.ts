import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { log } from "../pkg/log";
import { Events } from "../shared/event-enum";

const isProd = Bun.env.ENV === "production";

const url = isProd ? Bun.env.PRODUCTION_DATABASE_URL : Bun.env.DEV_DATABASE_URL;

const pool = new Pool({
    connectionString: url,
    ssl: isProd ? true : false,
});

export const initDb = async () => {
    try {
        await pool.connect();
        log.info({
            event: Events.DB_CONNECTED,
            message: "Database connected successfully",
        });
    } catch (error) {
        log.error({
            event: Events.DB_CONNECTION_ERROR,
            message: "Error connecting to the database:",
            error,
        });
        throw error;
    }
};

export async function closeDb() {
    log.warn({
        event: Events.DB_DISCONNECTED,
        message: "Closing database connection...",
    });
    await pool.end();
}

export const db = drizzle({ client: pool, casing: "snake_case" });
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

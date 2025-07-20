import { defineConfig } from "drizzle-kit";

const urlParam = process.env.PRODUCTION_DATABASE_URL;

export default defineConfig({
    dialect: "postgresql",

    schema: [],
    out: "./prod-migrations",

    dbCredentials: {
        url: urlParam!,
    },
    casing: "snake_case",
    migrations: {
        prefix: "timestamp",
    },
});

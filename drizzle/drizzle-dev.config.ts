import { defineConfig } from "drizzle-kit";
import path from "path";

const urlParam = process.env.DEV_DATABASE_URL;

export default defineConfig({
    dialect: "postgresql",
    schema: [
        path.resolve(__dirname, "../src/module/identity/schema"),

        // path.resolve(
        //     __dirname,
        //     "../src/modules/identity/credentials/schema.ts",
        // ),
        // path.resolve(__dirname, "../src/modules/identity/sessions/schema.ts"),
        path.resolve(__dirname, "../src/module/identity/otp/schema.ts"),
        // path.resolve(__dirname, "../src/modules/business/schema.ts"),
        path.resolve(__dirname, "../src/module/chat/schema"),
    ],
    out: "./.migrations",
    dbCredentials: {
        url: urlParam!,
    },
    casing: "snake_case",
    migrations: {
        prefix: "timestamp",
    },
});

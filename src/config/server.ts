import "@/pkg/cron";
import { closeDb, initDb } from "@/infra/db";
import { queue } from "@/infra/queue";
import { checkRedisHealth } from "@/infra/redis";
import { errorHandler } from "@/middleware/error";
import { requestLogger } from "@/middleware/request-logger";
import { corsHandler, helmetHandler } from "@/middleware/security";
import { initKeys } from "@/module/identity/utils";
import { Events } from "@/shared/event-enum";
import { log } from "@/pkg/log";
import { NotFoundError } from "@/shared/responses";
import { setupMemoryMonitoring } from "@/pkg/memory-monitor";
import compression from "compression";
import express, { type Express } from "express";
import hpp from "hpp";
import { router } from "./router";
import { subscribeToUserCreated } from "@/module/identity/event";
import { subscribeToChatSessionStarted } from "@/module/chat/event";

const isProd = Bun.env.ENV === "production";
const port = Number(Bun.env.PORT! ?? 3001);

setupMemoryMonitoring();

const app: Express = express()
    .use(compression({ threshold: 0 }))
    .use(requestLogger)
    .use(corsHandler)
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(hpp())
    .use(express.static("public"))
    .use("/api/v1", router);

app.get("/health", (_req, res) => {
    res.json({ pid: process.pid, port });
});

app.use((_req, _res, next) => {
    const err = new NotFoundError("Route not found");
    (err as any).code = "NOT_FOUND";
    next(err);
}).use(errorHandler);

if (isProd) app.use(helmetHandler);

export const startServer = async (): Promise<void> => {
    try {
        app.listen(port, () => {
            log.info({
                event: Events.SERVER_START,
                message: `Worker ${process.pid} is running at http://localhost:${port}`,
            });
        });
        await Promise.all([
            initDb(),
            queue.connect(),
            initKeys(),
            checkRedisHealth(),
        ]);
        await subscribeToUserCreated();
        await subscribeToChatSessionStarted();
    } catch (err: unknown) {
        closeDb();
        queue.close();
        log.error({
            event: Events.SERVER_START_FAILED,
            message: "Failed to start server",
            error: err instanceof Error ? err.message : String(err),
        });
        process.exit(1);
    }
};

const shutdown = (signal: string): Promise<void> => {
    log.warn({
        event: Events.SERVER_SHUTDOWN,
        message: `Received ${signal}, shutting down gracefully...`,
        timestamp: new Date().toISOString(),
    });
    log.info({
        event: Events.SERVER_STOPPED,
        message: "Server stopped cleanly",
    });
    process.exit(1);
};

["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => {
        queue.close();
        closeDb();
        shutdown(signal);
    });
});

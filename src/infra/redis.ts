import Redis from "ioredis";
import { log } from "@/pkg/log";
import { Events } from "@/shared/event-enum";

const isProd = Bun.env.ENV === "production";
const url = isProd ? Bun.env.REDIS_URL! : Bun.env.DEV_REDIS_URL!;

export const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 500, 3000),
    enableAutoPipelining: true,
    showFriendlyErrorStack: !isProd,
});

// Connection health check
export const checkRedisHealth = async (): Promise<boolean> => {
    try {
        await client.ping();
        return true;
    } catch (error) {
        log.error({
            event: "REDIS_HEALTH_FAIL",
            message: "Redis health check failed",
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
};

// Event listeners
client.on("connect", () => {
    log.info({
        event: Events.REDIS_CONNECTED,
        message: "Redis connected",
        status: client.status,
    });
});

client.on("ready", () => {
    log.info({
        event: "REDIS_READY",
        message: "Redis is ready",
        status: client.status,
    });
});

client.on("error", (err) => {
    log.error({
        event: " REDIS_ERROR",
        message: `Redis error: ${err.message}`,
        error: err.stack,
    });
});

client.on("reconnecting", () => {
    log.warn({
        event: "REDIS_RECONNECTING",
        message: "Redis reconnecting",
        status: client.status,
    });
});

client.on("end", () => {
    log.warn({
        event: Events.REDIS_DISCONNECTED,
        message: "Redis connection closed",
        status: client.status,
    });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
    await client.quit();
    log.info({
        event: "REDIS_SHUTDOWN",
        message: "Redis connection gracefully closed",
    });
});

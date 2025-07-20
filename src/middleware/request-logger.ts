import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { Events } from "../shared/event-enum";
import { log } from "../pkg/log";
import { asyncContext, getRequestContext } from "../context/async";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers["x-request-id"]?.toString() || randomUUID();
    const start = Date.now();
    const userAgent = req.headers["user-agent"] || "unknown";
    const forwarded = req.headers["x-forwarded-for"] as string | undefined;
    const ip =
        forwarded?.split(",")[0].trim() ||
        (req.headers["x-real-ip"] as string) ||
        req.socket.remoteAddress ||
        "unknown";

    const platform = /iPad|Tablet/i.test(userAgent)
        ? "browser"
        : /Mobile|Android|iPhone|iPod/i.test(userAgent)
          ? "mobile"
          : "browser";

    const store: RequestStore = {
        requestId,
        userAgent,
        ip,
        platform,
    };

    res.setHeader("x-request-id", requestId);

    asyncContext.run(store, () => {
        log.info({
            event: Events.REQUEST_RECEIVED,
            requestId,
            method: req.method,
            url: req.originalUrl,
            ip,
            userAgent,
            platform,
            timestamp: new Date(start).toISOString(),
        });

        res.on("finish", () => {
            const duration = Date.now() - start;
            const ctx = getRequestContext();

            log.info({
                event: Events.REQUEST_COMPLETED,
                requestId: ctx?.requestId,
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: ctx?.ip,
                userId: ctx?.user?.id,
            });
        });

        next();
    });
}

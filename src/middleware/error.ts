import type { Request, Response, NextFunction } from "express";
import { HttpError, InternalServerError } from "../shared/responses";
import { HttpStatus } from "../shared/http-status";
import { log } from "../pkg/log";
import { Events } from "../shared/event-enum";
import { getRequestContext } from "@/context/async";
import { get } from "http";

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    const ctx = getRequestContext();
    const requestId =
        req.headers["x-request-id"]?.toString() ||
        (req as any).requestId ||
        ctx?.requestId ||
        "unknown";

    const method = req.method;
    const url = req.originalUrl;

    // 📍 Handle 404 (this is typically handled separately)
    if (err?.code === "NOT_FOUND") {
        log.warn({
            event: Events.ROUTE_NOT_FOUND,
            requestId,
            method,
            url,
            message: "Route not found",
        });

        return res.status(HttpStatus.NOT_FOUND).json({
            success: false,
            status: HttpStatus.NOT_FOUND,
            requestId,
            message: `Route ${method} ${url} not found.`,
        });
    }

    // 📍 Handle known HttpError
    if (err instanceof HttpError) {
        log.warn({
            // event: Events.HTTP_ERROR,
            requestId,
            method,
            url,
            title: err.title,
            message: err.message,
            status: err.status,
        });

        return res.status(err.status ?? 500).json({
            success: false,
            status: err.status ?? 500,
            requestId,
            title: err.title,
            message: err.message ?? "Internal server error",
        });
    }

    // 📍 Handle unexpected internal errors
    const message = err instanceof Error ? err.message : String(err);
    const internalError = new InternalServerError();

    log.error({
        event: Events.UNHANDLED_ERROR,
        requestId,
        method,
        url,
        message,
        code: err?.code,
        stack: err instanceof Error ? err.stack : undefined,
    });

    return res.status(internalError.status).json({
        success: false,
        status: internalError.status,
        requestId,
        title: internalError.title,
        message: internalError.message,
    });
}

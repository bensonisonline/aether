import type { Request, Response, NextFunction } from "express";
import { SessionRepository } from "../module/identity/repository/session";
import { UnauthorizedError } from "@/shared/responses";
import { log } from "@/pkg/log";
import { Events } from "@/shared/event-enum";
import { getRequestContext } from "@/context/async";
import type { IToken } from "@/module/identity/types";

const session = new SessionRepository();
const getActiveTeamKey = (userId: string) => `user:${userId}:activeTeam`;

/**
 * Verifies access token, injects user into context and req.
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const ctx = getRequestContext();
    const requestId = ctx?.requestId ?? "unknown";

    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split("Bearer ")[1]
        : undefined;

    if (!token) {
        log.warn({
            event: Events.UNAUTHORIZED,
            requestId,
            message: "Missing or invalid token",
            url: req.originalUrl,
        });
        return next(new UnauthorizedError("Missing or invalid token"));
    }

    try {
        const { user } = (await session.validateAccess(token)) as {
            user: IToken;
        };

        const enrichedUser: IToken = {
            ...user,
        };

        // Inject into Express request and AsyncContext
        (req as any).user = enrichedUser;
        if (ctx) ctx.user = enrichedUser;

        next();
    } catch (err) {
        log.warn({
            event: Events.TOKEN_INVALID,
            requestId,
            message: "Invalid or expired token",
            url: req.originalUrl,
        });
        next(new UnauthorizedError("Invalid or expired token"));
    }
}

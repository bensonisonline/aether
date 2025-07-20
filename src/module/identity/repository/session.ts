import { createHash } from "crypto";
import {
    getPrivateCryptoKey,
    getPublicCryptoKey,
} from "@/module/identity/utils";
import { errors, jwtVerify, SignJWT } from "jose";
import type { IToken } from "../types";
import { UnauthorizedError } from "@/shared/responses";
import { db } from "@/infra/db";
import { eq, sql, and } from "drizzle-orm";
import { session, type NewSession } from "../schema/session";

export class SessionRepository {
    static accessTokenExpiration = "7d";
    static now = Math.floor(Date.now() / 1000);

    static hashFingerprint(fingerprint: string) {
        return createHash("sha256").update(fingerprint).digest("hex");
    }
    generateAccess = async (user: IToken): Promise<string> => {
        const privateKey = getPrivateCryptoKey();
        return new SignJWT({ user })
            .setProtectedHeader({ alg: "RS256", kid: "aether-auth-key" })
            .setIssuedAt(SessionRepository.now)
            .setIssuer("river-auth")
            .setExpirationTime(SessionRepository.accessTokenExpiration)
            .sign(privateKey);
    };

    async validateAccess(token: string) {
        try {
            const publicKey = getPublicCryptoKey();
            const { payload } = await jwtVerify(token, publicKey, {
                algorithms: ["RS256"],
            });
            return payload;
        } catch (err: any) {
            if (err instanceof errors.JWTExpired) {
                throw new UnauthorizedError("Access token expired");
            }
            throw new UnauthorizedError("Invalid access token");
        }
    }

    async getLoginAttempts(userId: string) {
        const [record] = await db
            .select({ loginAttempts: session.loginAttempts })
            .from(session)
            .where(eq(session.userId, userId));
        return record;
    }

    async updateLoginAttempt(userId: string) {
        await db
            .update(session)
            .set({ loginAttempts: sql`${session.loginAttempts} + 1` })
            .where(eq(session.userId, userId));
    }

    async resetLoginAttempt(userId: string) {
        await db
            .update(session)
            .set({ loginAttempts: 0 })
            .where(eq(session.userId, userId));
    }

    async updateLastLogin(userId: string) {
        await db
            .update(session)
            .set({ lastLogin: new Date() })
            .where(eq(session.userId, userId));
    }

    async getSessions(userId: string) {
        return db.select().from(session).where(eq(session.userId, userId));
    }

    createNewSession = async (data: NewSession) => {
        const hashed = SessionRepository.hashFingerprint(data.fingerprint);
        const [created] = await db
            .insert(session)
            .values({ ...data, fingerprint: hashed })
            .returning();
        return created;
    };

    async compareDevice(
        userId: string,
        fingerprint: string,
        platform: "browser" | "mobile",
    ): Promise<{ status: "known" | "challenge" | "new" }> {
        const hashed = SessionRepository.hashFingerprint(fingerprint);
        const [existing] = await db
            .select()
            .from(session)
            .where(
                and(
                    eq(session.userId, userId),
                    eq(session.fingerprint, hashed),
                ),
            );

        if (existing) {
            await this.updateLastLogin(userId);
            return { status: "known" };
        }

        const [hasType] = await db
            .select()
            .from(session)
            .where(
                and(eq(session.userId, userId), eq(session.platform, platform)),
            );

        if (hasType) return { status: "challenge" };

        return { status: "new" };
    }
    activateSession = async (userId: string) => {
        await db
            .update(session)
            .set({ isActive: true })
            .where(eq(session.userId, userId));
    };
    async revokeAllSessions(userId: string) {
        await db
            .update(session)
            .set({
                isActive: false,
                // refreshToken: null,
                // refreshTokenExpiresAt: null,
            })
            .where(eq(session.userId, userId));
    }
}

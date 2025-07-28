import { db } from "@/infra/db";
import { client } from "@/infra/redis";
import type { IAuthUser, IToken } from "@/module/identity/types";
import { eq } from "drizzle-orm";
import { session } from "../schema/session";
import { user } from "../schema/user";
import { SessionRepository } from "./session";

export class AuthRepository {
    private SessionRepository: SessionRepository;

    constructor() {
        this.SessionRepository = new SessionRepository();
    }

    createUser = async (u: IAuthUser) => {
        return await db.transaction(async (tx) => {
            const [created] = await tx
                .insert(user)
                .values({
                    email: u.email,
                    isVerified: true,
                })
                .returning();
            const tokenObject: IToken = {
                id: created.id,
                email: created.email,
                status: "active",
                fingerprint: u.fingerprint,
            };

            const accessToken =
                await this.SessionRepository.generateAccess(tokenObject);

            const hashedFingerprint = SessionRepository.hashFingerprint(
                u.fingerprint,
            );
            await tx.insert(session).values({
                userId: created.id,
                fingerprint: hashedFingerprint,
                platform: u.platform,
                provider: "local",
                lastLogin: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            return { user: created, accessToken };
        });
    };

    completeLogin = async (token: IToken) => {
        const accessToken = await this.SessionRepository.generateAccess(token);

        await client.del(`refresh:${token.id}`);

        await db
            .update(session)
            .set({
                lastLogin: new Date(),
                isActive: true,
            })
            .where(eq(session.userId, token.id));

        return { accessToken };
    };
}

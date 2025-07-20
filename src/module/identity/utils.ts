import argon2 from "argon2";
import { Cron } from "croner";
import { lt } from "drizzle-orm";
import { db } from "@/infra/db";
import { otpLog } from "./otp/schema";
import { log } from "@/pkg/log";
import path from "path";
import fs from "fs";
import type { User } from "./schema/user";
import { ProfileRepository } from "./repository/profile";

let privateCryptoKey: CryptoKey;
let publicCryptoKey: CryptoKey;
let publicJWK: any;

const keyDir = path.join(process.cwd(), "keys");
const privPath = path.join(keyDir, "private.jwk.json");
const pubPath = path.join(keyDir, "public.jwk.json");

// Load key pair from disk
export const initKeys = async () => {
    if (!fs.existsSync(privPath) || !fs.existsSync(pubPath)) {
        throw new Error(
            "Key files not found. Run generateAndPersistKeys first.",
        );
    }

    const privJWK = JSON.parse(fs.readFileSync(privPath, "utf-8"));
    const pubJWK = JSON.parse(fs.readFileSync(pubPath, "utf-8"));

    privateCryptoKey = await crypto.subtle.importKey(
        "jwk",
        privJWK,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        true,
        ["sign"],
    );

    publicCryptoKey = await crypto.subtle.importKey(
        "jwk",
        pubJWK,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        true,
        ["verify"],
    );

    publicJWK = pubJWK;
};

// Accessors
export const getPrivateCryptoKey = () => {
    if (!privateCryptoKey) throw new Error("Private key not loaded");
    return privateCryptoKey;
};

export const getPublicCryptoKey = () => {
    if (!publicCryptoKey) throw new Error("Public key not loaded");
    return publicCryptoKey;
};

export const getJWKS = () => {
    if (!publicJWK) throw new Error("Public JWK not loaded");
    return { keys: [publicJWK] };
};

export class Crypto {
    hash = async (value: string): Promise<string> => {
        return await argon2.hash(value, {
            type: argon2.argon2id,
            timeCost: 3,
            memoryCost: 2 ** 16,
            parallelism: 1,
        });
    };

    verify = async (hashed: string, value: string): Promise<boolean> => {
        return await argon2.verify(hashed, value);
    };
}

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export const otpCleanupCron = (time: string) => {
    return new Cron(
        time,
        { timezone: "Africa/Lagos", name: "OTP cleanup" },
        async () => {
            log.info({
                event: "OTP_CLEANUP_STARTED",
                message: "[ OTP Cleanup started ] - Running",
            });
            const jobStart = new Date();

            try {
                const result = await db
                    .delete(otpLog)
                    .where(lt(otpLog.createdAt, sevenDaysAgo))
                    .execute();

                const affectedRows = "rowCount" in result ? result.rowCount : 0;

                log.info({
                    event: "OTP_CLEANUP_SUCCESS",
                    message: `OTP cleaned up successfully. Deleted ${affectedRows} records.`,
                    duration: Date.now() - jobStart.getTime() + "ms",
                    timestamp: jobStart,
                });
            } catch (err) {
                log.error({
                    event: "OTP_CLEANUP_FAILED",
                    message: err ?? "OTP cleanup failed",
                });
            }
        },
    );
};

export function sanitizeUser(user: User): Omit<User, "passwordHash"> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}

export async function generateUsernameFromEmail(
    email: string,
): Promise<string> {
    const profileRepo = new ProfileRepository();

    const localPart = email.split("@")[0].toLowerCase();
    let base = localPart.replace(/[^a-z0-9_]/gi, "_");

    base = base.slice(0, 12);
    if (base.length < 3) {
        base = `user_${Math.floor(Math.random() * 10000)}`;
    }

    let username = base;
    let suffix = 1;

    while (true) {
        const existing = await profileRepo.findByUserName(
            username.toLowerCase(),
        );
        if (!existing) break;

        suffix += 1;
        username = `${base}${suffix}`;
        if (username.length > 15) {
            username = `user_${Date.now().toString().slice(-6)}`;
            break;
        }
    }

    return username;
}

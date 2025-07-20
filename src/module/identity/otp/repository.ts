import { db } from "@/infra/db";
import { client } from "@/infra/redis";
import { otpLog } from "./schema";
import type { CreateOtpAuditLog } from "../types";

const OTP_TTL_SECONDS = Number(Bun.env.OTP_TTL_SECONDS) || 3600; // 1 hour

export class OtpRepository {
    generate(length = 6): string {
        const otpArray = new Uint8Array(length);
        crypto.getRandomValues(otpArray);
        return Array.from(otpArray)
            .map((num) => (num % 10).toString())
            .join("");
    }

    async set(
        identifier: string,
        otp: string,
        code: string,
        time: number = OTP_TTL_SECONDS,
    ): Promise<void> {
        const key = `otp:${code}:${identifier}`;
        await client.set(key, otp, "EX", time);
    }

    async markResent(identifier: string): Promise<void> {
        const key = `otp:resend:${identifier}`;
        await client.set(key, Date.now().toString(), "EX", 60 * 2.5); // ✅ 2.30 minutes
    }

    async get(identifier: string, code: string): Promise<string | null> {
        return client.get(`otp:${code}:${identifier}`);
    }

    async delete(identifier: string, code: string): Promise<void> {
        await client.del(`otp:${code}:${identifier}`);
    }

    // Rate limiting resend: store timestamp of last sent OTP
    async canResend(
        identifier: string,
        cooldownSeconds: number,
    ): Promise<boolean> {
        const key = `otp:resend:${identifier}`;
        const lastSent = await client.get(key);
        if (!lastSent) return true;

        const lastSentTime = Number(lastSent);
        return Date.now() - lastSentTime > cooldownSeconds * 1000;
    }
    async log(t: CreateOtpAuditLog) {
        await db.insert(otpLog).values({
            identifier: t.identifier,
            channel: t.channel,
            event: t.event,
            ip: t.ip,
            userAgent: t.userAgent,
        });
    }
}

export const otp = new OtpRepository();

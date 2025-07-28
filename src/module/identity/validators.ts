import * as z from "zod";

export const emailSchema = z
    .email("Invalid email format")
    .max(320, "Email too long");

export const usernameSchema = z.object({
    username: z
        .string()
        .min(3)
        .max(15)
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username must be alphanumeric or underscores only",
        ),
});

export const avatarSchema = z.object({
    avatarUrl: z
        .url("Avatar must be a valid URL")
        .max(2048)
        .refine(
            (url) => /\.(jpg|jpeg|png|webp|gif|svg)$/.test(url),
            "Avatar must be an image URL",
        ),
});

export const otpSchema = z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must be numeric");

export const loginSchema = z.object({
    email: emailSchema,
    fingerprint: z.string(),
    platform: z.enum(["mobile", "browser"]),
});

export const registerSchema = z.object({
    email: emailSchema,
    name: z.string().max(50),
    fingerprint: z.string(),
    platform: z.enum(["mobile", "browser"]),
});

export const otpVerification = z.object({
    email: emailSchema,
    otp: otpSchema,
});

import * as z from "zod";

export const emailSchema = z
    .email("Invalid email format")
    .max(320, "Email too long");

export const passwordSchema = z
    .string()
    .min(6, "Password must be at least 8 characters")
    .max(12, "Password too long")
    .refine((val) => /[a-z]/.test(val), "Must contain a lowercase letter")
    .refine((val) => /[A-Z]/.test(val), "Must contain an uppercase letter")
    .refine((val) => /\d/.test(val), "Must contain a digit")
    .refine(
        (val) => /[!@#$%^&*()\-_=+{};:,<.>]/.test(val),
        "Must contain a special character",
    );

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
    password: z.string().min(1, "Password is required"),
    fingerprint: z.string(),
    platform: z.enum(["mobile", "browser"]),
});

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    fingerprint: z.string(),
    platform: z.enum(["mobile", "browser"]),
});

export const otpVerification = z.object({
    email: emailSchema,
    otp: otpSchema,
});

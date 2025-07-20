import { render } from "@react-email/components";
import { transporter } from "./transport";
import OTPEmail from "./email/OTPEmail";
import React from "react";
import WelcomeEmail from "./email/WelcomeEmail";

type EmailType = "otp" | "welcome";

export async function sendEmail(
    type: EmailType,
    to: string,
    subject: string,
    payload: { code?: string; name?: string; message?: string },
) {
    let html = "";

    switch (type) {
        case "otp":
            if (!payload.code) throw new Error("Missing OTP code");
            html = await render(
                React.createElement(OTPEmail, { code: payload.code }),
            );

            break;
        case "welcome":
            if (!payload.name) throw new Error("Missing name or message");
            html = await render(
                React.createElement(WelcomeEmail, {
                    name: payload.name,
                }),
            );
            break;
    }
    try {
        const result = await transporter.sendMail({
            from: "Aether AI <no-reply@aether.ai>",
            to,
            subject,
            html,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        });
        console.log("Email sent successfully", result.messageId);
    } catch (error) {
        console.log("Error sending email", error);
    }
}

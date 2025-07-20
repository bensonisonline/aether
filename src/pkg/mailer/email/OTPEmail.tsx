import React from "react";
import { EmailLayout } from "./layouts/EmailLayout";

interface OTPEmailProps {
    code: string;
}

const OTPEmail: React.FC<OTPEmailProps> = ({ code }) => {
    return (
        <EmailLayout preview={`Your verification code is ${code}`}>
            <h2>Verify your email</h2>
            <p>Use the following code to verify your account:</p>
            <div
                style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    letterSpacing: "6px",
                    background: "#f0f0f0",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    display: "inline-block",
                }}
            >
                {code}
            </div>
            <p style={{ marginTop: "24px", fontSize: "12px", color: "#888" }}>
                This code expires in 15 minutes. Ignore it if you did not create
                an account on Aether
            </p>
        </EmailLayout>
    );
};

export default OTPEmail;

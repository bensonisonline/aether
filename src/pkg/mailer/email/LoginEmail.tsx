import React from "react";
import { EmailLayout } from "./layouts/EmailLayout";

interface LoginEmailProps {
    code: string;
}

const LoginEmail: React.FC<LoginEmailProps> = ({ code }) => {
    return (
        <EmailLayout preview={`Your Login code is ${code}`}>
            <h2>Login to your account</h2>
            <p>Use the following code to login to your account:</p>
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
                This code expires in 10 minutes. Ignore if you did not initiate
                a login on Aether
            </p>

            <p>
                Stay productive,
                <br />— Aether AI
            </p>
        </EmailLayout>
    );
};

export default LoginEmail;

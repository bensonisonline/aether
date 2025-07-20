import { Html, Head, Preview, Body, Container } from "@react-email/components";

export const EmailLayout = ({
    children,
    preview,
}: {
    preview?: string;
    children: React.ReactNode;
}) => (
    <Html>
        <Head />
        {preview && <Preview>{preview}</Preview>}
        <Body style={{ backgroundColor: "#f4f4f4", padding: "40px 0" }}>
            <Container
                style={{
                    backgroundColor: "#ffffff",
                    padding: "32px",
                    borderRadius: "8px",
                    fontFamily: "sans-serif",
                }}
            >
                <header style={{ marginBottom: "24px" }}>
                    <h1 style={{ fontSize: "20px", color: "#04070cff" }}>
                        Aether AI
                    </h1>
                </header>

                {children}

                <footer
                    style={{
                        marginTop: "32px",
                        fontSize: "12px",
                        color: "#888",
                    }}
                >
                    <p>Need help? Reply to this email.</p>
                    <p>Aether AI — Terms · Privacy</p>
                </footer>
            </Container>
        </Body>
    </Html>
);

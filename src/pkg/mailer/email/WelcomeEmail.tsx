import { Section } from "@react-email/components";
import { EmailLayout } from "./layouts/EmailLayout";

interface WelcomeEmailProps {
    name: string;
}
export const WelcomwEmail: React.FC<WelcomeEmailProps> = ({ name }) => (
    <EmailLayout preview={`Aether AI: Message for ${name}`}>
        <h4 style={{ fontWeight: "normal" }}>Hello {name},</h4>
        <p>
            Welcome to Aether — your AI-powered learning hub for mastering
            college life.
        </p>
        <Section>
            Here, you can:
            <p>🧠 Ask deep questions and get real answers instantly.</p>
            <p>📚 Build or take mini-courses tailored to your major</p>
            <p>🏛️ Join your campus cohort and study with peers.</p>
            <p>
                Whether you're prepping for finals, stuck on a project, or just
                exploring ideas — Aether is here, 24/7.
                <br />
                Let's make learning radically smarter.
                <br />
                Start Now
            </p>
        </Section>
        <p>
            Stay productive,
            <br />— Aether AI
        </p>
    </EmailLayout>
);

export default WelcomwEmail;

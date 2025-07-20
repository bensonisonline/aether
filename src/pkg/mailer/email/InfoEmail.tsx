import { EmailLayout } from "./layouts/EmailLayout";

interface InfoEmailProps {
    name: string;
    message: string;
}
export const InfoEmail: React.FC<InfoEmailProps> = ({ name, message }) => (
    <EmailLayout preview={`Aether AI: Message for ${name}`}>
        <p>Hello {name},</p>
        <p>{message}</p>
        <p>
            Stay productive,
            <br />— Aether AI
        </p>
    </EmailLayout>
);

export default InfoEmail;

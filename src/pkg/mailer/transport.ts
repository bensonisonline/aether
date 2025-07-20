import { createTransport } from "nodemailer";

const isProd = Bun.env.ENV === "production";
const dev = Bun.env.DEV_MAIL_HOST;
const prod = Bun.env.PROD_MAIL_HOST;

export const transporter = createTransport({
    host: isProd ? prod : dev,
    port: 587,
    auth: {
        user: isProd ? Bun.env.PROD_MAIL_USER : Bun.env.DEV_MAIL_USER,
        pass: isProd ? Bun.env.PROD_MAIL_PASS : Bun.env.DEV_MAIL_PASS,
    },
});

// const mailOptions = (to: string, subject: string, html: string): MailOptions => ({
//     from: "Aether AI <noreply@aether.ai>",
//     to,
//     subject,
//     html
// })

// const sendMail = async (to: string, subject: string, html: string) => {
//   const options = mailOptions(to, subject, html)
//   try {
//     const result  = await transporter.sendMail(options)
//     console.log("Email sent successfully", result.messageId)
//   } catch (error) {
//     console.log("Error sending email", error)
//   }
// }

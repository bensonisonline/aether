import cors from "cors";
import helmet from "helmet";

const isProd = Bun.env.ENV === "production";

export const corsHandler = cors({
    origin: isProd ? ["", ""] : "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
});

export const helmetHandler = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
        },
    },
    hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
    },
});

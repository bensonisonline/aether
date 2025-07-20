import pino from "pino";

const getPinoTransport = () => {
    const isProd = Bun.env.ENV === "production";

    if (isProd) {
        return {
            targets: [
                {
                    target: "pino-roll",
                    options: {
                        file: "./logs/app.log",
                        frequency: "daily",
                        mkdir: true,
                        size: "10MB",
                        maxFiles: 10,
                    },
                    level: "info",
                },
                {
                    target: "pino-loki",
                    options: {
                        batching: true,
                        host: Bun.env.LOKI_URL!,
                        basicAuth: Bun.env.LOKI_AUTH!,
                        labels: { app: "Aether" },
                        interval: 5,
                    },
                    level: "info",
                },
            ],
        };
    }

    return {
        targets: [
            {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "SYS:standard",
                    ignore: "pid,hostname",
                },
                level: "debug",
            },
            {
                target: "pino/file",
                options: {
                    destination: "./logs/dev.log",
                    mkdir: true,
                },
                level: "debug",
            },
        ],
    };
};

export const log = pino({
    name: "Aether API",
    transport: getPinoTransport(),
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
});

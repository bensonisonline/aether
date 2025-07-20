import { AMQPClient, AMQPChannel, AMQPMessage } from "@cloudamqp/amqp-client";
import { log } from "../pkg/log";

export class QueueService {
    private client: AMQPClient;
    private channel: AMQPChannel | null = null;
    private isConnected = false;

    constructor(
        private readonly url: string = Bun.env.QUEUE_URL ?? "amqp://localhost",
    ) {
        this.client = new AMQPClient(this.url);
    }

    public async connect(): Promise<void> {
        try {
            await this.client.connect();
            this.channel = await this.client.channel();
            this.isConnected = true;

            log.info({
                event: "QUEUE_CONNECTED",
                message: `Connected to Queue at ${this.url}`,
            });
        } catch (err) {
            log.error({
                event: "QUEUE_CONNECT_FAILED",
                message: "Failed to connect to Queue. Retrying in 5 seconds...",
                error: err,
            });
            this.isConnected = false;
            setTimeout(() => this.connect(), 5000);
        }
    }

    public async reconnect(): Promise<void> {
        log.info({
            event: "QUEUE_RECONNECT",
            message: "Reconnecting to Queue...",
        });
        await this.connect();
    }

    private async getChannel(): Promise<AMQPChannel> {
        if (!this.isConnected || !this.channel) {
            await this.connect();
        }
        return this.channel!;
    }

    public async publish(queue: string, message: any): Promise<void> {
        try {
            const ch = await this.getChannel();
            await ch.queue(queue, { durable: true });

            const msgBuffer = Buffer.from(JSON.stringify(message));

            await ch.basicPublish("", queue, msgBuffer, {
                deliveryMode: 2, // persistent
            });

            log.info({
                event: "QUEUE_PUBLISHED",
                message: `Message sent to queue ${queue}`,
                payload: message,
            });
        } catch (error) {
            log.error({
                event: "QUEUE_PUBLISH_FAILED",
                message: `Publish to "${queue}" failed. Retrying...`,
                error,
            });
            setTimeout(() => this.publish(queue, message), 1000);
        }
    }

    public async subscribe(
        queue: string,
        handler: (message: any) => Promise<void> | void,
    ): Promise<void> {
        try {
            const ch = await this.getChannel();
            const q = await ch.queue(queue, { durable: true });

            await q.subscribe({ noAck: false }, async (msg: AMQPMessage) => {
                if (msg) {
                    try {
                        const body = msg.bodyToString();
                        if (body === null)
                            throw new Error("Received empty message body");

                        const content = JSON.parse(body);
                        await handler(content);
                        await msg.ack();
                    } catch (err) {
                        log.error({
                            event: "QUEUE_HANDLER_FAILED",
                            message: "Handler error. NACKing message.",
                            error: err,
                        });
                        await msg.nack();
                    }
                }
            });

            log.info({
                event: "QUEUE_SUBSCRIBED",
                message: `Subscribed to queue - ${queue}`,
            });
        } catch (error) {
            log.error({
                event: "QUEUE_SUBSCRIBE_FAILED",
                message: `Subscribe to queue "${queue}" failed. Retrying in 2s...`,
                error,
            });
            setTimeout(() => this.subscribe(queue, handler), 2000);
        }
    }

    public async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.channel = null;
            this.isConnected = false;
        }

        log.info({
            event: "QUEUE_DISCONNECTED",
            message: "Disconnected from Queue.",
        });
    }
}

export const queue = new QueueService();

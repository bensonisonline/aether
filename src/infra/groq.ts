import { sleep } from "bun";
import Groq from "groq-sdk";

export type ChatCompletionMessageParam = Parameters<
    Groq["chat"]["completions"]["create"]
>[0]["messages"][number];

const apiKey = Bun.env.GROQ_API_KEY;
export const client = new Groq({ apiKey });

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

// Helper type for basic message structure
export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export async function* chatCompletion(
    model: string,
    messages: ChatCompletionMessageParam[],
) {
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const response = await client.chat.completions.create({
                model,
                messages,
                max_tokens: 1024,
                temperature: 0.7,
                stop: null,
                stream: true,
            });

            let fullContent = "";
            for await (const chunk of response) {
                const content = chunk.choices[0]?.delta?.content || "";
                fullContent += content;
                yield content;
            }

            return fullContent;
        } catch (error: any) {
            if (retries >= MAX_RETRIES - 1) throw error;

            if (error.status === 429) {
                const jitter = Math.random() * 500;
                const delay = BASE_DELAY * Math.pow(2, retries) + jitter;
                console.warn(`Rate limited. Retrying in ${delay}ms...`);
                await sleep(delay);
                retries++;
            } else {
                throw error;
            }
        }
    }

    throw new Error("Max retries exceeded");
}

// Helper function to convert your messages to proper format
export function formatMessagesForGroq(
    messages: ChatMessage[],
): ChatCompletionMessageParam[] {
    return messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
    })) as ChatCompletionMessageParam[];
}

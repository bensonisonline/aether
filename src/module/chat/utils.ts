import Mustache from "mustache";
import { client } from "@/infra/groq";

export function hydratePrompt(
    template: object,
    variables: Record<string, string>,
): string {
    const json = JSON.stringify(template);
    const filled = Mustache.render(json, variables);
    return JSON.parse(filled);
}

const TITLE_GENERATION_SYSTEM_PROMPT = `
You are a title generation assistant. Create a concise, 3-5 word title 
based on the user's first message and the assistant's first response.

Examples:
User Message: "Hello, how are you?"
Assistant Response: "I'm doing well, thanks for asking."
Title: "How are you?"

User Message: "Can you help me with my project?"
Assistant Response: "Certainly, I can assist you with that."
Title: "Help with project"

User Message: "What is the best way to learn React?"
Assistant Response: "The best way to learn React is by building projects."
Title: "Best way to learn React"

Rules:
1. Capture the main topic or question
2. Use title case (capitalize important words)
3. Avoid quotation marks
4. Maximum 7 words
5. Make it human-readable and natural
`;

export const titleService = {
    async generateFromMessages(
        userMessage: string,
        assistantMessage: string,
    ): Promise<string> {
        const model = "llama3-8b-8192"; 

        const userPrompt = `
    User Message: ${userMessage}
    Assistant Response: ${assistantMessage}
    
    Generate title:
    `;

        const title = await client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: TITLE_GENERATION_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            max_tokens: 70,
            temperature: 0.5,
            stop: null,
            stream: false,
        });

        const format = title.choices[0].message.content!;

        return format
            .replace(/["']/g, "")
            .replace(/\n/g, " ")
            .trim()
            .substring(0, 70);
    },
};

export const GROQ_MODELS = {
    "llama3-8b-8192": {
        label: "LLaMA3-8B",
        cost: "low",
        speed: "fast",
        idealFor: ["summarization", "light tutoring"],
    },
    "llama3-70b-8192": {
        label: "LLaMA3-70B",
        cost: "mid",
        speed: "moderate",
        idealFor: ["academic help", "course generation"],
    },
    "mixtral-8x7b-32768": {
        label: "Mixtral 8x7B",
        cost: "high",
        speed: "slower",
        idealFor: ["resume writing", "structured content"],
    },
};

export const DEFAULT_MODEL = "llama3-8b-8192";

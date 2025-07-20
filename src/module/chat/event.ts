import { queue } from "@/infra/queue";
import { titleService } from "./utils";
import { ChatSessionRepository } from "./repository/chat-session";

const chatSessionRepo = new ChatSessionRepository();

export async function chatSessionStarted(
    chatId: string,
    userMessage: string,
    assistantMessage: string,
) {
    await queue.publish("chat:session:started", {
        chatId,
        userMessage,
        assistantMessage,
    });
    console.log(userMessage, assistantMessage)
}

export async function subscribeToChatSessionStarted() {
    return await queue.subscribe("chat:session:started", async (message) => {
        console.log(message)
        const { chatId, userMessage, assistantMessage } = message;
        const title = await titleService.generateFromMessages(
            userMessage,
            assistantMessage,
        );
        await chatSessionRepo.updateTitle(chatId, title);
        console.log(title)
    });
}

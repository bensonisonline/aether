import { queue } from "@/infra/queue";
import { sendEmail } from "@/pkg/mailer/sendEmail";
import { NotFoundError } from "@/shared/responses";
import { ProfileRepository } from "./repository/profile";
import { UserRepository } from "./repository/user";
import { generateUsernameFromEmail } from "./utils";

const userRepo = new UserRepository();
const profileRepo = new ProfileRepository();

export async function publishUserCreated<T>(userId: string, data: T) {
    await queue.publish("user:created", { userId, data });
}

export const subscribeToUserCreated = async () => {
    return await queue.subscribe("user:created", async (message) => {
        const { userId, data } = message;
        const user = await userRepo.findUserById(userId);
        if (!user) throw new NotFoundError("User not found");
        const username = await generateUsernameFromEmail(user.email);
        await profileRepo.createProfile(user.id, username, data.name);

        setTimeout(
            async () => {
                await sendEmail("welcome", user.email, "Welcome to Aether AI", {
                    name: data.name,
                });
            },
            5 * 60 * 1000,
        );
    });
};

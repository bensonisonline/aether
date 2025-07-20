import { Events } from "@/shared/event-enum";
import { HttpStatus } from "@/shared/http-status";
import { log } from "@/pkg/log";
import { NotFoundError, SuccessResponse } from "@/shared/responses";
import { UserRepository } from "../repository/user";
import type { User } from "../schema/user";

export class UserService {
    private repository: UserRepository;

    constructor() {
        this.repository = new UserRepository();
    }

    async findUserByEmail(email: string) {
        const user = await this.repository.findUserByEmail(email);

        if (!user) {
            log.error({
                event: Events.notFound("user"),
                message: `User not found with ${email}`,
                email,
            });
            throw new NotFoundError(
                `The user with this ${email} does not exist`,
            );
        }
        return SuccessResponse(HttpStatus.OK, "User found", { user });
    }

    async findUserById(id: string) {
        const user = await this.repository.findUserById(id);
        if (!user) {
            log.error({
                event: Events.notFound("user"),
                message: `User not found with ${id}`,
                id,
            });
            throw new NotFoundError(`The user with this ${id} does not exist`);
        }
        return SuccessResponse(HttpStatus.OK, "User found", { user });
    }

    async updateUser(id: string, updates: Partial<User>) {
        const user = await this.repository.userUpdate(id, updates);
        if (!user) {
            log.error({
                event: Events.notFound("user"),
                message: `User not found with ${id}`,
                id,
            });
            throw new NotFoundError(`The user does not exist`);
        }
        return SuccessResponse(HttpStatus.OK, "User updated", { user });
    }
}

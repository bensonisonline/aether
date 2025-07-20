import {
    BadRequestError,
    NotFoundError,
    SuccessResponse,
} from "@/shared/responses";
import { HttpStatus } from "@/shared/http-status";
import { ProfileRepository } from "../repository/profile";
import type { Profile } from "../schema/profile";
import { avatarSchema, usernameSchema } from "../validators";

export class ProfileService {
    private repository: ProfileRepository;

    constructor() {
        this.repository = new ProfileRepository();
    }

    async findById(id: string) {
        const record = await this.repository.findById(id);
        if (!record) throw new NotFoundError("Profile not found");
        return SuccessResponse(HttpStatus.OK, "Profile found", { record });
    }

    async findByUserId(userId: string) {
        const record = await this.repository.findByUserId(userId);
        if (!record) throw new NotFoundError("Profile not found");
        return SuccessResponse(HttpStatus.OK, "Profile found", { record });
    }

    async findByUserName(username: string) {
        const record = await this.repository.findByUserName(username);
        if (!record) throw new NotFoundError("Profile not found");
        return SuccessResponse(HttpStatus.OK, "Profile found", { record });
    }

    async update(id: string, updates: Partial<Profile>) {
        const record = await this.repository.update(id, updates);
        if (!record)
            throw new NotFoundError("Profile not found or update failed");
        return SuccessResponse(HttpStatus.OK, "Profile updated", { record });
    }

    async updateAvatar(profileId: string, avatarUrl: string) {
        const parsed = avatarSchema.safeParse({ avatarUrl });
        if (!parsed.success) {
            throw new BadRequestError(parsed.error.message);
        }

        const updated = await this.repository.update(profileId, {
            avatarUrl: parsed.data.avatarUrl,
        });

        if (!updated) {
            throw new BadRequestError("Failed to update avatar");
        }

        return SuccessResponse(HttpStatus.OK, "Avatar updated", {
            record: updated,
        });
    }

    async changeUserName(profileId: string, newUsername: string) {
        // 1. Validate username
        const parseResult = usernameSchema.safeParse({ username: newUsername });
        if (!parseResult.success) {
            throw new BadRequestError(parseResult.error.message);
        }
        const validatedUsername = parseResult.data.username;
        const normalized = validatedUsername.toLowerCase();

        // 2. Check for existing username conflict
        const existing = await this.repository.findByUserName(normalized);
        if (existing && existing.id !== profileId) {
            throw new BadRequestError("Username already exists");
        }

        // 3. Load current profile
        const profile = await this.repository.findById(profileId);
        if (!profile) throw new NotFoundError("Profile not found");

        // 4. Optional: enforce 1 change per 24h
        const changedRecently =
            await this.repository.hasChangedUsernameRecently(profileId);
        if (changedRecently) {
            throw new BadRequestError(
                "You can only change your username once every 24 hours",
            );
        }

        // 5. Update profile
        const updated = await this.repository.update(profileId, {
            username: normalized,
        });
        if (!updated) throw new BadRequestError("Failed to update profile");

        // 6. Log change
        await this.repository.logUsernameChange({
            profileId,
            oldUsername: profile.username,
            newUsername: normalized,
        });

        return SuccessResponse(HttpStatus.OK, "Username updated", {
            record: updated,
        });
    }
}

import type { Request, Response } from "express";
import { ProfileService } from "../service/profile";
import { UnauthorizedError } from "@/shared/responses";
import { getRequestContext } from "@/context/async";

export class ProfileController {
    private service = new ProfileService();

    async changeUsername(req: Request, res: Response) {
        const ctx = getRequestContext();
        const userId = ctx?.user?.id;
        if (!userId) throw new UnauthorizedError("Unauthorized");

        const { username } = req.body;

        // Get profileId from userId
        const profileResp = await this.service.findByUserId(userId);
        const profileId = profileResp.data.record.id;

        const result = await this.service.changeUserName(profileId, username);
        return res.status(result.status).send(result);
    }

    async getProfileById(req: Request, res: Response) {
        const result = await this.service.findById(req.params.id);
        return res.status(result.status).send(result);
    }

    async getProfileByUserId(req: Request, res: Response) {
        const result = await this.service.findByUserId(req.params.id);
        return res.status(result.status).send(result);
    }

    async updateProfile(req: Request, res: Response) {
        const result = await this.service.update(req.params.id, req.body);
        return res.status(result.status).send(result);
    }
}

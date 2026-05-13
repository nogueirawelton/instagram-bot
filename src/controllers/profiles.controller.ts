import type { FastifyReply, FastifyRequest } from "fastify";
import { ProfilesService } from "../services/profiles.service";

export class ProfilesController {
  private profilesService = new ProfilesService();

  async createProfile(request: FastifyRequest<{ Body: { username: string } }>) {
    const { username } = request.body;
    const profile = await this.profilesService.createProfile(username);
    return profile;
  }

  async findByUsername(
    request: FastifyRequest<{ Params: { username: string } }>,
    reply: FastifyReply,
  ) {
    const { username } = request.params;
    const profile = await this.profilesService.getProfile(username);

    if (!profile) {
      return reply.status(404).send({ message: "Profile not found" });
    }
    return profile;
  }

  async syncProfile(
    request: FastifyRequest<{ Params: { username: string } }>,
    reply: FastifyReply,
  ) {
    const { username } = request.params;

    const profile = await this.profilesService.getProfile(username);

    if (!profile) {
      return reply.status(404).send({ message: "Profile not found" });
    }

    const posts = await this.profilesService.syncProfile(profile);

    return posts;
  }

  async syncAllProfiles() {
    return this.profilesService.syncProfiles();
  }

  async list() {
    return this.profilesService.getProfiles();
  }

  async deleteProfile(
    request: FastifyRequest<{ Params: { username: string } }>,
    reply: FastifyReply,
  ) {
    const { username } = request.params;
    const profile = await this.profilesService.getProfile(username);

    if (!profile) {
      return reply.status(404).send({ message: "Profile not found" });
    }

    await this.profilesService.deleteProfile(username);

    return { message: "Profile deleted" };
  }
}

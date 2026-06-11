import type { FastifyInstance } from "fastify";
import { PostsRepository } from "../../database/repositories/posts.repository";
import { logger } from "../../utils/logger";
import { ProfilesService } from "./profiles.service";

export async function profilesRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: { username: string } }>(
    "/profiles",
    {
      schema: {
        body: {
          type: "object",
          required: ["username"],
          properties: {
            username: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const profile = await ProfilesService.create(request.body.username);
      return reply.code(201).send(profile);
    },
  );

  fastify.get("/profiles", async () => {
    return ProfilesService.findAll();
  });

  fastify.get("/profiles/sync", async () => {
    ProfilesService.syncAll().catch((err) =>
      logger.error("Falha no sync em background", err),
    );
    return { message: "Sync iniciado em background" };
  });

  fastify.get<{ Params: { username: string } }>(
    "/profiles/:username",
    async (request, reply) => {
      const profile = await ProfilesService.findByUsername(request.params.username, true);
      if (!profile)
        return reply.code(404).send({ message: "Profile not found" });
      return profile;
    },
  );

  fastify.get<{ Params: { username: string } }>(
    "/profiles/:username/manage",
    async (request, reply) => {
      const profile = await ProfilesService.findByUsername(request.params.username, false);
      if (!profile)
        return reply.code(404).send({ message: "Profile not found" });
      return profile;
    },
  );

  fastify.get<{ Params: { username: string } }>(
    "/profiles/:username/sync",
    async (request, reply) => {
      const profile = await ProfilesService.findByUsername(
        request.params.username,
      );
      if (!profile)
        return reply.code(404).send({ message: "Profile not found" });
      return ProfilesService.sync(profile);
    },
  );

  fastify.patch<{
    Params: { username: string; postId: string };
    Body: { visible: boolean };
  }>(
    "/profiles/:username/posts/:postId/visibility",
    {
      schema: {
        body: {
          type: "object",
          required: ["visible"],
          properties: { visible: { type: "boolean" } },
        },
      },
    },
    async (request) => {
      return PostsRepository.updateVisibility(request.params.postId, request.body.visible);
    },
  );

  fastify.put<{
    Params: { username: string };
    Body: { order: string[] };
  }>(
    "/profiles/:username/posts/order",
    {
      schema: {
        body: {
          type: "object",
          required: ["order"],
          properties: { order: { type: "array", items: { type: "string" } } },
        },
      },
    },
    async (request, reply) => {
      const items = request.body.order.map((id, position) => ({ id, position }));
      await PostsRepository.updateOrder(items);
      return reply.code(204).send();
    },
  );

  fastify.delete<{ Params: { username: string } }>(
    "/profiles/:username",
    async (request, reply) => {
      const profile = await ProfilesService.findByUsername(
        request.params.username,
      );
      if (!profile)
        return reply.code(404).send({ message: "Profile not found" });
      await ProfilesService.delete(request.params.username);
      return reply.code(204).send();
    },
  );
}

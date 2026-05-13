import { type FastifyInstance } from "fastify";
import { ProfilesController } from "../controllers/profiles.controller";

export async function profilesRoutes(fastify: FastifyInstance) {
  const controller = new ProfilesController();

  fastify.post(
    "/profiles",
    {
      schema: {
        body: {
          type: "object",
          required: ["username"],
          properties: {
            username: { type: "string", minLength: 3 },
          },
        },
      },
    },
    controller.createProfile.bind(controller),
  );

  fastify.get("/profiles", controller.list.bind(controller));

  fastify.get(
    "/profiles/:username",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            username: { type: "string" },
          },
        },
      },
    },
    controller.findByUsername.bind(controller),
  );

  fastify.get(
    "/profiles/:username/sync",
    controller.syncProfile.bind(controller),
  );

  fastify.get("/profiles/sync", controller.syncAllProfiles.bind(controller));

  fastify.delete(
    "/profiles/:username",
    controller.deleteProfile.bind(controller),
  );
}

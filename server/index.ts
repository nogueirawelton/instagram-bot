import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import path from "path";
import { env } from "./src/config/env";
import { migrate } from "./src/database/client";
import { profilesRoutes } from "./src/modules/profiles/profiles.routes";
import { logger } from "./src/utils/logger";

const app = fastify({ logger: false });

app.register(fastifyStatic, {
  root: path.join(import.meta.dir, "public", "media"),
  prefix: "/media",
});

app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
});

app.register(profilesRoutes, { prefix: "/api" });

const shutdown = async () => {
  logger.info("Encerrando servidor...");
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

try {
  await migrate();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  logger.info(`API rodando na porta ${env.PORT}`);
} catch (err) {
  logger.error("Erro ao iniciar a API", err);
  process.exit(1);
}

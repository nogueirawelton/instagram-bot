import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import path from "path";
import { fileURLToPath } from "url";
import { profilesRoutes } from "./src/routes/profiles.routes";
import { Logger } from "./src/utils/Logger";

const app = fastify({ logger: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.register(fastifyStatic, {
  root: path.join(__dirname, "public", "media"),
  prefix: "/media",
});

app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
});

app.register(profilesRoutes, { prefix: "/api" });

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) });
    Logger.info(`API rodando na porta ${process.env.PORT}`);
  } catch (err) {
    Logger.error("Erro ao iniciar a API", err);
    process.exit(1);
  }
};

start();

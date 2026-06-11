import fs from "fs";
import path from "path";
import winston from "winston";
import { env } from "../config/env";

const logDir = "logs";
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const winstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880,
    }),
  ],
});

if (env.NODE_ENV !== "production") {
  winstonLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

export const logger = {
  info: (message: string, meta?: unknown) => winstonLogger.info(message, { meta }),
  error: (message: string, error?: unknown) => winstonLogger.error(message, { error }),
  warn: (message: string, meta?: unknown) => winstonLogger.warn(message, { meta }),
};

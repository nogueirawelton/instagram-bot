import { Database } from "bun:sqlite";

export const db = new Database("src/database/sqlite.db");
db.run("PRAGMA foreign_keys = ON;");

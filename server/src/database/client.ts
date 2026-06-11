import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 10 });

export async function migrate(): Promise<void> {
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT TRUE`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS position INTEGER`;
}

export default sql;

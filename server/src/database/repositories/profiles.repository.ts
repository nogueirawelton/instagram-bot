import sql from "../client";
import type { Profile } from "../../types/profile";

export const ProfilesRepository = {
  async findByUsername(username: string): Promise<Profile | undefined> {
    const [profile] = await sql<Profile[]>`
      SELECT * FROM profiles WHERE username = ${username}
    `;
    return profile;
  },

  async findAll(): Promise<Profile[]> {
    return sql<Profile[]>`
      SELECT
        p.*,
        COUNT(posts.id)::int AS "postsCount",
        COUNT(posts.id) FILTER (WHERE posts.visible = true)::int AS "visiblePostsCount"
      FROM profiles p
      LEFT JOIN posts ON posts."profileUsername" = p.username
      GROUP BY p.username
    `;
  },

  async create(data: { username: string; name: string; avatarUrl: string }): Promise<Profile> {
    const rows = await sql<Profile[]>`
      INSERT INTO profiles (username, name, "avatarUrl")
      VALUES (${data.username}, ${data.name}, ${data.avatarUrl})
      RETURNING *
    `;
    return rows[0]!;
  },

  async updateProfile(username: string, data: { name: string; avatarUrl: string }): Promise<void> {
    await sql`
      UPDATE profiles SET name = ${data.name}, "avatarUrl" = ${data.avatarUrl} WHERE username = ${username}
    `;
  },

  async updateLastSync(username: string, date: Date): Promise<void> {
    await sql`
      UPDATE profiles SET "lastSync" = ${date.toISOString()} WHERE username = ${username}
    `;
  },

  async delete(username: string): Promise<void> {
    await sql`DELETE FROM profiles WHERE username = ${username}`;
  },
};

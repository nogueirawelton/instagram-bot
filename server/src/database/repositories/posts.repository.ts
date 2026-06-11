import sql from "../client";
import type { Post } from "../../types/post";

export interface UpsertPostInput {
  id: string;
  url: string;
  imagePath: string;
  pinned: boolean;
  createdAt: string;
  profileUsername: string;
}

export const PostsRepository = {
  async findByProfile(username: string, visibleOnly = false): Promise<Post[]> {
    return sql<Post[]>`
      SELECT * FROM posts
      WHERE "profileUsername" = ${username}
      ${visibleOnly ? sql`AND visible = TRUE` : sql``}
      ORDER BY position ASC NULLS LAST, pinned DESC, "createdAt" DESC
    `;
  },

  async upsert(post: UpsertPostInput): Promise<Post> {
    const rows = await sql<Post[]>`
      INSERT INTO posts (id, url, "imagePath", pinned, "createdAt", "profileUsername")
      VALUES (
        ${post.id},
        ${post.url},
        ${post.imagePath},
        ${post.pinned},
        ${post.createdAt},
        ${post.profileUsername}
      )
      ON CONFLICT (id) DO UPDATE SET pinned = EXCLUDED.pinned
      RETURNING *
    `;
    return rows[0]!;
  },

  async updateVisibility(id: string, visible: boolean): Promise<Post> {
    const rows = await sql<Post[]>`
      UPDATE posts SET visible = ${visible} WHERE id = ${id} RETURNING *
    `;
    return rows[0]!;
  },

  async updateOrder(items: { id: string; position: number }[]): Promise<void> {
    if (items.length === 0) return;
    const ids = items.map((i) => i.id);
    const positions = items.map((i) => i.position);
    await sql`
      UPDATE posts SET position = d.position
      FROM unnest(${ids}::text[], ${positions}::int[]) AS d(id, position)
      WHERE posts.id = d.id
    `;
  },

  async deleteByProfile(username: string): Promise<void> {
    await sql`DELETE FROM posts WHERE "profileUsername" = ${username}`;
  },
};

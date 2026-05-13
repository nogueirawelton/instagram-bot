import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { db } from "../database/client";

export class PostsService {
  async createPost(
    username: string,
    post: {
      shortcode: string;
      thumbnail: string;
      pinned: boolean;
      createdAt: Date;
    },
  ) {
    const existingPost = db
      .query("SELECT * FROM posts WHERE id = ?")
      .get(post.shortcode);

    if (existingPost) {
      const updatedPost = db
        .prepare("UPDATE posts SET pinned = ? WHERE id = ? RETURNING *")
        .get(post.pinned, post.shortcode);

      return updatedPost;
    }

    try {
      const fileName = `${post.shortcode}.jpg`;
      const filePath = path.join("public", "media", fileName);

      const response = await axios.get(post.thumbnail, {
        responseType: "arraybuffer",
      });

      await fs.writeFile(filePath, response.data);

      const createdPost = db
        .prepare(
          `
        INSERT INTO posts (id, url, imagePath, pinned, createdAt, profileUsername) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
        RETURNING *
      `,
        )
        .get(
          post.shortcode,
          `https://instagram.com/p/${post.shortcode}`,
          `/media/${fileName}`,
          post.pinned,
          post.createdAt.toISOString(),
          username,
        );

      return createdPost;
    } catch (error: any) {
      console.error(
        `Erro ao baixar imagem para o post ${post.shortcode}:`,
        error.message,
      );
    }
  }
}

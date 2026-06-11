import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { PostsRepository } from "../../database/repositories/posts.repository";
import type { Post } from "../../types/post";

export interface ScrapedPost {
  shortcode: string;
  thumbnail: string;
  pinned: boolean;
  createdAt: Date;
}

export interface ScrapedUser {
  fullName: string;
  profilePicUrl: string;
}

export interface ScrapedResult {
  user: ScrapedUser;
  posts: ScrapedPost[];
}

export class PostsService {
  async savePost(username: string, scraped: ScrapedPost): Promise<Post> {
    const fileName = `${scraped.shortcode}.jpg`;
    const filePath = path.join("public", "media", fileName);

    const response = await axios.get<ArrayBuffer>(scraped.thumbnail, {
      responseType: "arraybuffer",
    });
    await fs.writeFile(filePath, Buffer.from(response.data));

    return PostsRepository.upsert({
      id: scraped.shortcode,
      url: `https://instagram.com/p/${scraped.shortcode}`,
      imagePath: `/media/${fileName}`,
      pinned: scraped.pinned,
      createdAt: scraped.createdAt.toISOString(),
      profileUsername: username,
    });
  }
}

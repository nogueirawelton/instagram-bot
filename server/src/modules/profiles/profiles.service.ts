import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { PostsRepository } from "../../database/repositories/posts.repository";
import { ProfilesRepository } from "../../database/repositories/profiles.repository";
import { Scraper } from "../../scraper/scraper";
import type { Post } from "../../types/post";
import type { Profile } from "../../types/profile";
import { logger } from "../../utils/logger";
import { PostsService } from "../posts/posts.service";

const postsService = new PostsService();

async function downloadAvatar(url: string, username: string): Promise<string> {
  const fileName = `avatar_${username}.jpg`;
  const filePath = path.join("public", "media", fileName);
  const response = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });
  await fs.writeFile(filePath, Buffer.from(response.data));
  return `/media/${fileName}`;
}

export const ProfilesService = {
  async create(username: string): Promise<Profile> {
    const scraper = await Scraper.init();
    try {
      const scraped = await scraper.findPosts(username);
      const avatarUrl = await downloadAvatar(scraped.user.profilePicUrl, username);

      const profile = await ProfilesRepository.create({
        username,
        name: scraped.user.fullName,
        avatarUrl,
      });

      await Promise.all(scraped.posts.map((post) => postsService.savePost(username, post)));
      await ProfilesRepository.updateLastSync(username, new Date());

      return profile;
    } finally {
      await scraper.close();
    }
  },

  async findByUsername(username: string, visibleOnly = false): Promise<Profile | undefined> {
    const profile = await ProfilesRepository.findByUsername(username);
    if (!profile) return undefined;

    const posts = await PostsRepository.findByProfile(username, visibleOnly);
    return { ...profile, posts };
  },

  async findAll(): Promise<Profile[]> {
    return ProfilesRepository.findAll();
  },

  async sync(profile: Profile, externalScraper?: Scraper): Promise<Post[]> {
    const scraper = externalScraper ?? (await Scraper.init());

    try {
      const scraped = await scraper.findPosts(profile.username);

      const avatarUrl = await downloadAvatar(scraped.user.profilePicUrl, profile.username);
      await ProfilesRepository.updateProfile(profile.username, {
        name: scraped.user.fullName,
        avatarUrl,
      });

      const savedPosts = await Promise.all(
        scraped.posts.map((post) => postsService.savePost(profile.username, post)),
      );

      await ProfilesRepository.updateLastSync(profile.username, new Date());

      return savedPosts;
    } finally {
      if (!externalScraper) await scraper.close();
    }
  },

  async syncAll() {
    const profiles = await ProfilesRepository.findAll();

    if (profiles.length === 0) return [];

    const scraper = await Scraper.init();
    const results: { username: string; posts: Post[] }[] = [];

    try {
      for (const profile of profiles) {
        logger.info(`Iniciando sync de: ${profile.username}`);
        try {
          const posts = await ProfilesService.sync(profile, scraper);
          results.push({ username: profile.username, posts });
          logger.info(`Sync finalizado para ${profile.username}`);
        } catch (error) {
          logger.error(`Falha ao sincronizar ${profile.username}`, error);
        }
      }
    } finally {
      await scraper.close();
    }

    return results;
  },

  async delete(username: string): Promise<void> {
    const posts = await PostsRepository.findByProfile(username);

    await PostsRepository.deleteByProfile(username);
    await ProfilesRepository.delete(username);

    const filesToDelete = [
      path.join("public", "media", `avatar_${username}.jpg`),
      ...posts.map((p) => path.join("public", p.imagePath)),
    ];

    await Promise.allSettled(filesToDelete.map((f) => fs.unlink(f)));
  },
};

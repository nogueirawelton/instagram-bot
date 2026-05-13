import { addDays, isAfter, isBefore } from "date-fns";
import { db } from "../database/client";
import type { Post } from "../entities/post.entity";
import type { Profile } from "../entities/profile.entity";
import { Logger } from "../utils/Logger";
import { PostsService } from "./posts.service";
import { Scraper } from "./scraper.service";

export class ProfilesService {
  private postsService = new PostsService();

  async createProfile(username: string) {
    const profile = db
      .prepare(
        `
        INSERT INTO profiles (username) VALUES (?)
        RETURNING *
      `,
      )
      .get(username);

    await this.syncProfile(profile as Profile);

    return profile;
  }

  async getProfile(username: string): Promise<Profile | undefined> {
    const profile = db
      .prepare("SELECT * FROM profiles WHERE username = ?")
      .get(username);

    if (!profile) return undefined;

    const posts = db
      .prepare(
        "SELECT * FROM posts WHERE profileUsername = ? ORDER BY pinned DESC, createdAt DESC",
      )
      .all(username);

    return { ...profile, posts } as Profile;
  }

  async getProfiles(): Promise<Profile[]> {
    const profiles = db.query("SELECT * FROM profiles").all();
    return profiles as Profile[];
  }

  async syncProfile(
    profile: Profile,
    externalScraper?: Scraper,
  ): Promise<Post[]> {
    if (
      profile.lastSync &&
      isAfter(addDays(new Date(profile.lastSync), 1), new Date())
    ) {
      return [];
    }

    const scraper = externalScraper || (await Scraper.init());

    try {
      const posts = await scraper.findPosts(profile.username);

      const createdPosts = await Promise.all(
        posts.map(
          (post: {
            shortcode: string;
            thumbnail: string;
            pinned: boolean;
            createdAt: Date;
          }) => this.postsService.createPost(profile.username, post),
        ),
      );

      db.prepare(
        `
        UPDATE profiles SET lastSync = ? WHERE username = ?
        RETURNING *
      `,
      ).get(new Date().toISOString(), profile.username);

      return createdPosts;
    } finally {
      if (!externalScraper) {
        await scraper.closeBrowser();
      }
    }
  }

  async deleteProfile(username: string) {
    const profile = this.getProfile(username);

    if (!profile) return;

    db.run(
      `
        DELETE FROM posts WHERE profileUsername = ?
      `,
      [username],
    );

    db.run(
      `
        DELETE FROM profiles WHERE username = ?
      `,
      [username],
    );
  }

  async syncProfiles() {
    const profiles = await this.getProfiles();
    const profilesToSync = profiles.filter((profile) => {
      if (!profile.lastSync) return true;
      return isBefore(addDays(new Date(profile.lastSync), 1), new Date());
    });

    if (profilesToSync.length === 0) return [];

    const scraper = await Scraper.init();
    const results = [];

    try {
      for (const profile of profilesToSync) {
        Logger.info(`Iniciando sync de: ${profile.username}`);
        try {
          const createdPosts = await this.syncProfile(profile, scraper);
          results.push({ username: profile.username, createdPosts });
          Logger.info(`Sync finalizado para ${profile.username}`);
        } catch (error) {
          Logger.error(`Falha ao sincronizar ${profile.username}:`, error);
        }
      }
    } finally {
      await scraper.closeBrowser();
    }

    return results;
  }
}

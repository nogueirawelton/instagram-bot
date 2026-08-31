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

async function downloadAvatar(url: string, username: string): Promise<string | null> {
  try {
    logger.info(`[downloadAvatar] Criando diretório public/media para ${username}`);
    const fileName = `avatar_${username}.jpg`;
    const filePath = path.join("public", "media", fileName);
    await fs.mkdir(path.join("public", "media"), { recursive: true });

    logger.info(`[downloadAvatar] Baixando avatar de ${username}: ${url}`);
    const response = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });

    logger.info(`[downloadAvatar] Salvando avatar de ${username} em ${filePath}`);
    await fs.writeFile(filePath, Buffer.from(response.data));

    logger.info(`[downloadAvatar] Avatar de ${username} salvo com sucesso`);
    return `/media/${fileName}`;
  } catch (error) {
    logger.error(`[downloadAvatar] Falha ao baixar avatar de ${username}`, error);
    return null;
  }
}


export const ProfilesService = {
  async create(username: string): Promise<Profile> {
    logger.info(`[create] Iniciando criação do perfil: ${username}`);
    const scraper = await Scraper.init();
    logger.info(`[create] Scraper iniciado para: ${username}`);
    try {
      logger.info(`[create] Buscando posts de: ${username}`);
      const scraped = await scraper.findPosts(username);
      logger.info(`[create] Posts encontrados para ${username}: ${scraped.posts.length} posts`);

      const avatarUrl = await downloadAvatar(scraped.user.profilePicUrl, username) ?? "";

      logger.info(`[create] Salvando perfil no banco: ${username}`);
      const profile = await ProfilesRepository.create({
        username,
        name: scraped.user.fullName,
        avatarUrl,
      });
      logger.info(`[create] Perfil salvo: ${username}`);

      logger.info(`[create] Salvando ${scraped.posts.length} posts de ${username}`);
      await Promise.all(scraped.posts.map((post) => postsService.savePost(username, post)));

      logger.info(`[create] Atualizando lastSync de ${username}`);
      await ProfilesRepository.updateLastSync(username, new Date());

      logger.info(`[create] Criação do perfil ${username} concluída`);
      return profile;
    } finally {
      logger.info(`[create] Fechando scraper para ${username}`);
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
    logger.info(`[sync] Iniciando sync do perfil: ${profile.username}`);
    const scraper = externalScraper ?? (await Scraper.init());
    if (!externalScraper) logger.info(`[sync] Scraper iniciado para: ${profile.username}`);

    try {
      logger.info(`[sync] Buscando posts de: ${profile.username}`);
      const scraped = await scraper.findPosts(profile.username);
      logger.info(`[sync] Posts encontrados para ${profile.username}: ${scraped.posts.length} posts`);

      const avatarUrl = await downloadAvatar(scraped.user.profilePicUrl, profile.username) ?? "";

      logger.info(`[sync] Atualizando dados do perfil: ${profile.username}`);
      await ProfilesRepository.updateProfile(profile.username, {
        name: scraped.user.fullName,
        avatarUrl,
      });

      logger.info(`[sync] Salvando ${scraped.posts.length} posts de ${profile.username}`);
      const savedPosts = await Promise.all(
        scraped.posts.map((post) => postsService.savePost(profile.username, post)),
      );

      logger.info(`[sync] Atualizando lastSync de ${profile.username}`);
      await ProfilesRepository.updateLastSync(profile.username, new Date());

      logger.info(`[sync] Sync do perfil ${profile.username} concluído`);
      return savedPosts;
    } finally {
      if (!externalScraper) {
        logger.info(`[sync] Fechando scraper para ${profile.username}`);
        await scraper.close();
      }
    }
  },

  async syncAll() {
    logger.info(`[syncAll] Iniciando sync de todos os perfis`);
    const profiles = await ProfilesRepository.findAll();
    logger.info(`[syncAll] ${profiles.length} perfis encontrados`);

    if (profiles.length === 0) return [];

    const scraper = await Scraper.init();
    logger.info(`[syncAll] Scraper iniciado`);
    const results: { username: string; posts: Post[] }[] = [];

    try {
      for (const profile of profiles) {
        logger.info(`[syncAll] Iniciando sync de: ${profile.username}`);
        try {
          const posts = await ProfilesService.sync(profile, scraper);
          results.push({ username: profile.username, posts });
          logger.info(`[syncAll] Sync finalizado para ${profile.username}`);
        } catch (error) {
          logger.error(`[syncAll] Falha ao sincronizar ${profile.username}`, error);
        }
      }
    } finally {
      logger.info(`[syncAll] Fechando scraper`);
      await scraper.close();
    }

    logger.info(`[syncAll] Sync de todos os perfis concluído`);
    return results;
  },

  async delete(username: string): Promise<void> {
    logger.info(`[delete] Deletando perfil: ${username}`);
    const posts = await PostsRepository.findByProfile(username);

    logger.info(`[delete] Removendo ${posts.length} posts do banco: ${username}`);
    await PostsRepository.deleteByProfile(username);

    logger.info(`[delete] Removendo perfil do banco: ${username}`);
    await ProfilesRepository.delete(username);

    const filesToDelete = [
      path.join("public", "media", `avatar_${username}.jpg`),
      ...posts.map((p) => path.join("public", p.imagePath)),
    ];

    logger.info(`[delete] Removendo ${filesToDelete.length} arquivos de mídia: ${username}`);
    await Promise.allSettled(filesToDelete.map((f) => fs.unlink(f)));
    logger.info(`[delete] Perfil ${username} deletado com sucesso`);
  },
};

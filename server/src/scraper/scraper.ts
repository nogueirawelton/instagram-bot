import type { Browser, BrowserContext, Response } from "playwright";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { ScrapedResult } from "../modules/posts/posts.service";
import { logger } from "../utils/logger";

chromium.use(StealthPlugin());

interface RawPostEdge {
  node: {
    shortcode: string;
    display_url: string;
    pinned_for_users: unknown[];
    taken_at_timestamp: number;
  };
}

interface RawUserResult {
  user: {
    full_name: string;
    profile_pic_url_downloadable: string;
  };
}

export class Scraper {
  private constructor(
    private readonly browser: Browser,
    private readonly context: BrowserContext,
  ) {}

  async findPosts(username: string, retries = 3): Promise<ScrapedResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt < retries; attempt++) {
      const page = await this.context.newPage();
      try {
        const postResponsePromise = page.waitForResponse(
          (res: Response) =>
            res.url().includes("postsV2") && res.status() === 200,
          { timeout: 60000 },
        );

        const userResponsePromise = page.waitForResponse(
          (res: Response) =>
            res.url().includes("userInfo") && res.status() === 200,
          { timeout: 60000 },
        );

        logger.info("Carregando página");
        await page.goto("https://sssinstagram.com/en1");

        try {
          await page
            .getByRole("button", { name: /consent/i })
            .click({ timeout: 5000 });
        } catch {
          logger.info("Banner de consentimento não apareceu, seguindo o fluxo");
        }

        logger.info("Buscando perfil");
        await page
          .getByPlaceholder("Paste link here")
          .fill(`https://www.instagram.com/${username}/`);
        await page.keyboard.press("Enter");

        logger.info("Aguardando resposta");
        await page.screenshot({
          path: `screenshots/${username}-${Date.now()}.png`,
          fullPage: true,
        });

        const postResponse = await postResponsePromise;
        const postData = await postResponse.json();

        const userResponse = await userResponsePromise;
        const userData = await userResponse.json();

        return {
          user: (userData.result as RawUserResult[]).map((user) => ({
            fullName: user.user.full_name,
            profilePicUrl: user.user.profile_pic_url_downloadable,
          }))[0]!,
          posts: (postData.result.edges as RawPostEdge[])
            .map((item) => ({
              shortcode: item.node.shortcode,
              thumbnail: item.node.display_url,
              pinned: item.node.pinned_for_users.length > 0,
              createdAt: new Date(item.node.taken_at_timestamp * 1000),
            }))
            .filter((item) => item.shortcode && item.thumbnail),
        };
      } catch (error) {
        lastError = error;
        const delay = Math.pow(2, attempt);
        logger.warn(
          `Tentativa ${attempt + 1} para ${username} falhou. Retry em ${delay}s`,
        );
        await Bun.sleep(delay * 1000);
      } finally {
        await page.close();
      }
    }

    throw lastError;
  }

  async close(): Promise<void> {
    await this.browser.close();
  }

  static async init(): Promise<Scraper> {
    logger.info("Iniciando navegador");

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    });

    return new Scraper(browser, context);
  }
}

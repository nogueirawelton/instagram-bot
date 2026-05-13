import { chromium } from "playwright-extra";
import { Logger } from "../utils/Logger";

export class Scraper {
  private browser: any = null;
  private context: any = null;

  constructor(browser: any, context: any) {
    this.browser = browser;
    this.context = context;
  }

  async findPosts(username: string, retries = 3) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      const page = await this.context!.newPage();
      try {
        const responsePromise = page.waitForResponse(
          (response: any) =>
            response.url().includes("postsV2") && response.status() === 200,
          { timeout: 60000 },
        );

        Logger.info(`Carregando página`);
        await page.goto("https://sssinstagram.com/en1");

        try {
          await page
            .getByRole("button", { name: /consent/i })
            .click({ timeout: 5000 });
          console.log("Botão de consentimento clicado.");
        } catch (error) {
          // O fluxo continua normalmente aqui se o botão não for encontrado
          console.log(
            "Banner de consentimento não apareceu. Seguindo o fluxo...",
          );
        }

        Logger.info(`Buscando perfil`);
        await page
          .getByPlaceholder("Paste link here")
          .fill(`https://www.instagram.com/${username}/`);
        await page.keyboard.press("Enter");

        Logger.info(`Aguardando resposta`);
        await page.screenshot({
          path: `screenshots/${username}-${Date.now()}.png`,
          fullPage: true, // Opcional: tira print de toda a extensão da página
        });
        const response = await responsePromise;
        const data = await response.json();

        return data.result.edges
          .map((item: any) => ({
            shortcode: item?.node?.shortcode,
            thumbnail: item?.node?.display_url,
            pinned: item?.node?.pinned_for_users.length > 0,
            createdAt: new Date(item?.node?.taken_at_timestamp * 1000),
          }))
          .filter((item: any) => item.shortcode && item.thumbnail);
      } catch (error) {
        lastError = error;
        Logger.warn(
          `Tentativa ${i + 1} de sync para ${username} falhou. Tentando novamente em ${Math.pow(2, i)}s...`,
        );
        await Bun.sleep(Math.pow(2, i) * 1000);
      } finally {
        await page.close();
      }
    }

    throw lastError;
  }

  async closeBrowser() {
    await this.browser.close();
    this.browser = null;
    this.context = null;
  }

  static async init() {
    Logger.info(`Iniciando navegador`);

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

import TelegramBot, { Message } from "node-telegram-bot-api";
import dotenv from "dotenv";
import puppeteer from "puppeteer";

dotenv.config();

const token = process.env.TELEGRAM_TOKEN as string;

const bot = new TelegramBot(token, { polling: true });

async function takeScreenshot(page: any, screenSize: string): Promise<Buffer> {
  let width = 1366;
  let height = 768;

  if (screenSize === "mobile") {
    width = 375;
    height = 812;
  } else if (screenSize === "tablet") {
    width = 768;
    height = 1024;
  }

  await page.setViewport({ width, height });

  const screenshotBuffer = await page.screenshot();
  return screenshotBuffer;
}

async function generatePDF(page: any): Promise<Buffer> {
  const pdfBuffer = await page.pdf({ format: "A4" });
  return pdfBuffer;
}

bot.onText(
  /\/screenshot (.+) (.+)/,
  async (msg: Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const url = match![1];
    const screenSize = match![2];

    bot.sendMessage(chatId, "Taking screenshot...");
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(url);

      const screenshotBuffer = await takeScreenshot(page, screenSize);

      // Send the screenshot as a photo to the user
      bot.sendPhoto(chatId, screenshotBuffer);

      await browser.close();
    } catch (error) {
      console.error("Error:", error);
      bot.sendMessage(chatId, "An error occurred while taking the screenshot.");
    }
  }
);

bot.onText(
  /\/pdf (.+)/,
  async (msg: Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const url = match![1];

    bot.sendMessage(chatId, "Generating PDF...");
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(url);

      const pdfBuffer = await generatePDF(page);

      // Send the PDF as a document to the user
      bot.sendDocument(chatId, pdfBuffer);

      await browser.close();
    } catch (error) {
      console.error("Error:", error);
      bot.sendMessage(chatId, "An error occurred while generating the PDF.");
    }
  }
);

bot.on("message", (msg: Message) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Received your message");
});

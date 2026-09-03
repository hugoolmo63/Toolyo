import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('https://example.com');
    const screenshot = await page.screenshot({ encoding: 'base64' });
    await browser.close();
    res.status(200).json({ screenshot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
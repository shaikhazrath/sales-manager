const puppeteer = require('puppeteer');
const fs = require('fs');
const urlModule = require('url');



export const webscraper = async (url) => {
  const browser = await puppeteer.launch();
  const startUrl = 'https://www.tenali.ai';

  await scrapePage(startUrl, browser, startUrl);

  await browser.close();
  console.log(textData)
  console.log('Scraping complete. Data saved to scrapedText.json.');
}

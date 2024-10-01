import puppeteer from "puppeteer";
const visitedUrls = new Set();
const textData = [];

const skipKeywords = ['login', 'signup', 'auth', 'password-reset'];

function shouldSkipUrl(url) {
    return skipKeywords.some(keyword => url.includes(keyword));
}

function isSameDomain(url, baseUrl) {
    const baseHostname = new URL(baseUrl).hostname;
    const urlHostname = new URL(url).hostname;
    return baseHostname === urlHostname;
}

async function scrapePage(url, browser, baseUrl) {
    if (visitedUrls.has(url) || shouldSkipUrl(url) || !isSameDomain(url, baseUrl)) {
        return;
    }

    visitedUrls.add(url);
    console.log(`Scraping ${url}`);

    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const pageText = await page.evaluate(() => document.body.innerText);
        textData.push({ url, text: pageText });

        const links = await page.evaluate(() =>
            Array.from(document.querySelectorAll('a[href]'))
                .map(link => link.href)
                .filter(href => href.startsWith('http'))
        );

        for (const link of links) {
            await scrapePage(link, browser, baseUrl);
        }
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
    } finally {
        await page.close();
    }
}
export async function POST(request) {
    try {
        const { url } = await request.json();
        const browser = await puppeteer.launch();
        const startUrl = url;

        await scrapePage(startUrl, browser, startUrl);

        await browser.close();
        return new Response(JSON.stringify(textData), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}
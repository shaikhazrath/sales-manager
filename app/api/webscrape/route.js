import { JSDOM } from 'jsdom';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

const pc = new Pinecone({
    apiKey: 'pcsk_3F3uHz_FSL1katfpjvPn3MvsWKmM8onPh1wbeeg3m2fqFSYehrvzeSaChDiwvyf9MHiXia'
});

const genAI = new GoogleGenerativeAI('AIzaSyC449GmuXR5ongxeePmqZJ7BUxAbb28fQw');

function chunkTranscript(transcript, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < transcript.length) {
        const end = Math.min(start + chunkSize, transcript.length);
        chunks.push(transcript.slice(start, end));
        start += chunkSize - overlap; // Move forward, accounting for overlap
    }

    return chunks;
}

async function generateEmbeddings(text) {
    if (Buffer.byteLength(text, 'utf8') > 10000) {
        throw new Error("Text chunk exceeds 10,000 bytes limit");
    }

    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding;
}

async function storeTranscriptInPinecone(transcript) {
    const transcriptId = uuidv4();
    const chunks = chunkTranscript(transcript);
    const index = pc.index('cm');

    const batchSize = 200; 
    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = await Promise.all(
            chunks.slice(i, i + batchSize).map(async (chunk, j) => {
                const embedding = await generateEmbeddings(chunk);
                const vectorValues = Array.isArray(embedding) ? embedding : Object.values(embedding);
                return {
                    id: `${transcriptId}-${i + j}`,
                    values: vectorValues,
                    metadata: {
                        transcriptId,
                        chunkIndex: i + j,
                        text: chunk,
                    },
                };
            })
        );

        await index.namespace(transcriptId).upsert(batch);
        console.log(`Stored batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`);
    }

    console.log(`Stored transcript with ID: ${transcriptId}`);
    return transcriptId;
}

const skipKeywords = ['login', 'signup', 'auth', 'password-reset'];
const visitedUrls = new Set();
const textData = [];
const queue = [];
let isScraping = false;

function shouldSkipUrl(url) {
    return skipKeywords.some(keyword => 
        url.toLowerCase().includes(keyword)
    );
}

function resolveUrl(baseUrl, path) {
    try {
        return new URL(path, baseUrl).href;
    } catch (e) {
        return null;
    }
}

function isSameDomain(url, baseHostname) {
    try {
        const urlHostname = new URL(url).hostname;
        return urlHostname === baseHostname;
    } catch (e) {
        return false;
    }
}


async function scrapePage(baseUrl, maxDepth = 2, maxPages = 30) {
    if (isScraping) return;
    isScraping = true;

    const baseHostname = new URL(baseUrl).hostname;
    const queue = [{ url: baseUrl, depth: 0 }];
    const visitedUrls = new Map(); 
    let pagesScraped = 0; 

    while (queue.length > 0 && pagesScraped < maxPages) {
        const { url: currentUrl, depth: currentDepth } = queue.shift();

        if (visitedUrls.has(currentUrl) || 
            shouldSkipUrl(currentUrl) || 
            !isSameDomain(currentUrl, baseHostname)) {
            continue;
        }

        // Skip if depth exceeds the maximum allowed depth
        if (currentDepth > maxDepth) {
            continue;
        }

        visitedUrls.set(currentUrl, currentDepth); // Mark as visited with depth
        console.log(`Scraping: ${currentUrl} (Depth: ${currentDepth})`);

        try {
            const response = await fetch(currentUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const html = await response.text();
            const dom = new JSDOM(html);
            const document = dom.window.document;

            // Extract text content
            const bodyText = document.body.textContent
                .trim()
                .replace(/\s+/g, ' ');
            textData.push({ url: currentUrl, content: bodyText });
            pagesScraped++; // Increment the counter for each page scraped

            // Stop if we've reached the maximum number of pages
            if (pagesScraped >= maxPages) {
                console.log(`Reached the maximum of ${maxPages} pages. Stopping.`);
                break;
            }

            // Collect and resolve links
            const links = Array.from(document.querySelectorAll('a[href]'))
                .map(a => resolveUrl(currentUrl, a.href))
                .filter(href => 
                    href && 
                    href.startsWith('http') &&
                    isSameDomain(href, baseHostname) &&
                    !shouldSkipUrl(href) &&
                    !visitedUrls.has(href)
                );
            links.forEach(link => {
                if (!queue.some(item => item.url === link)) {
                    queue.push({ url: link, depth: currentDepth + 1 });
                }
            });

            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.error(`Error scraping ${currentUrl}:`, error.message);
        }
    }

    isScraping = false;
    console.log(`Finished scraping. Total pages scraped: ${pagesScraped}`);
    return textData;
}


export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url || typeof url !== 'string' || !/^https?:\/\//.test(url)) {
            return new Response(JSON.stringify({ message: "Invalid URL provided" }), { status: 400 });
        }

        await scrapePage(url);

        const combinedText = textData.map(item => item.content).join('\n');
        const allurls = textData.map(item => item.url)



        console.log("Combined text length:", combinedText.length);
        const transcriptId = await storeTranscriptInPinecone(combinedText);

        return new Response(JSON.stringify({ transcriptId,allurls }), { status: 200 });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ message: error.message || "Internal Server Error" }), { status: 500 });
    }
}
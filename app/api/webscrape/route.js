import { JSDOM } from 'jsdom';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';

const pc = new Pinecone({
    apiKey: '7de18ffb-6a70-4108-ae77-a0496b8a1341'
});

const genAI = new GoogleGenerativeAI('AIzaSyA594S9gDTZTJZBzeN6Y8mbjblvFCFZhUI');

function chunkTranscript(transcript, chunkSize = 1000) {
    const chunks = [];
    for (let i = 0; i < transcript.length; i += chunkSize) {
      chunks.push(transcript.slice(i, i + chunkSize));
    }
    return chunks;
}

async function generateEmbeddings(text) {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding;
}

async function storeTranscriptInPinecone(transcript) {
    const transcriptId = uuidv4();
    const chunks = chunkTranscript(transcript);
    const index = pc.index('cm');

    const batchSize = 100; 
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

const visitedUrls = new Set();
let textData = '';

const skipKeywords = ['login', 'signup', 'auth', 'password-reset'];

function shouldSkipUrl(url) {
    return skipKeywords.some(keyword => url.includes(keyword));
}

function isSameDomain(url, baseUrl) {
    const baseHostname = new URL(baseUrl).hostname;
    const urlHostname = new URL(url).hostname;
    return baseHostname === urlHostname;
}

async function scrapePage(url, baseUrl) {
    if (visitedUrls.has(url) || shouldSkipUrl(url) || !isSameDomain(url, baseUrl)) {
        return;
    }

    visitedUrls.add(url);
    console.log(`Scraping ${url}`);

    try {
        const response = await fetch(url);
        const html = await response.text();

        const dom = new JSDOM(html);
        const { document } = dom.window;

        const pageText = document.body.textContent || '';
        textData = textData + pageText;

        const links = Array.from(document.querySelectorAll('a[href]'))
            .map(link => link.href)
            .filter(href => href.startsWith('http'));

        for (const link of links) {
            await scrapePage(link, baseUrl);
        }
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
    }
}

export async function POST(request) {
    try {
        const { url } = await request.json();
        const startUrl = url;

        await scrapePage(startUrl, startUrl);

        console.log(textData);
        const transcriptId = await storeTranscriptInPinecone(textData);

        return new Response(JSON.stringify(transcriptId), { status: 200 });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = 'AIzaSyC449GmuXR5ongxeePmqZJ7BUxAbb28fQw';
const genAI = new GoogleGenerativeAI(apiKey);
const pc = new Pinecone({
     apiKey: 'pcsk_3F3uHz_FSL1katfpjvPn3MvsWKmM8onPh1wbeeg3m2fqFSYehrvzeSaChDiwvyf9MHiXia'
});

async function generateEmbeddings(text) {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);

    const embedding = Array.isArray(result.embedding) ? result.embedding : Object.values(result.embedding);

    return embedding;
}

async function geminiAi(conv, namespaceid) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const queryEmbedding = await generateEmbeddings(conv);
    const searchResults = await pc.index('cm').namespace(namespaceid).query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true
      });
    

      const relevantContext = searchResults.matches.map(match => match.metadata.text).join(' ');

    const promptTemplate = `
      You was the owner of this site and the site complete context this this 
      Context:
      ${relevantContext}

      answer this question based on this context 

      Question: ${conv}

   
    `;

    const result = await model.generateContent(promptTemplate);
    const response = result.response.text();
    
    console.log(response);
    return response;
  } catch (error) {
    console.error("Error in geminiAi function:", error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const { conv, namespaceid } = await request.json();
    const data = await geminiAi(conv, namespaceid);
    return new Response(JSON.stringify({ response: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
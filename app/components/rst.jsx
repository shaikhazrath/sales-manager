'use client'
import React, { useEffect, useState } from 'react';
import { Symbl } from '@symblai/symbl-web-sdk';

const SymblConversation = () => {
  const [transcript, setTranscript] = useState('');
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    let connection;

    const initializeSymbl = async () => {
      if (typeof window !== 'undefined') {

        try {
            const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjU2MjA1OTgwMTE3MjM3NzYiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoiR05icHc5ZFQ2NnRJMUN2UTNDVUZNaHBiZzhLR1h5UWhAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNzI3NzA0OTUzLCJleHAiOjE3Mjc3OTEzNTMsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyIsImF6cCI6IkdOYnB3OWRUNjZ0STFDdlEzQ1VGTWhwYmc4S0dYeVFoIn0.QuUDvtQUnQeu_hLwfrSAq475dH3Jha8JoWZjTaK5o32hDP6hG00o0wPYeuI0EQPTpVI8gs_0UQcnn90zfAJD5PqxiYn4TFubYH9HCGLrcfbF99-cmblF8PHAbMtJM-mD8WvvJHGuDQAXvE3ATqoHlJqlZRVxR_cgqaReVwa6yygxTWxTVjCMIOEXe2_Ptz8U5_VpETnN1bzczFU8PTOL48TyGt_4mqQHys5gRwkZvx02JyFoLLAX0h6stFWuT8ffEF0_fhqu0SuhRUPDsnEzPrLE_KXlM7rQ20SNhz-6-aOCTDvo2S8ewxXR8j3vx95uWK_YSDGU0alNDsiyRyQlrA";
          // Example usage
          const symbl = new Symbl({ accessToken });

          connection = await symbl.createConnection();
          await connection.startProcessing({
            insightTypes: ["question", "action_item", "follow_up"],
            config: { encoding: "OPUS" },
            speaker: { userId: "user@example.com", name: "User" }
          });

          connection.on("speech_recognition", (speechData) => {
            const { punctuated } = speechData;
            const name = speechData.user ? speechData.user.name : "User";
            setTranscript(prev => `${prev}${name}: ${punctuated.transcript}\n`);
          });

          connection.on("topic", (topicData) => {
            setTopics(prev => [...prev, ...topicData.map(topic => topic.phrases)]);
          });

          connection.on("question", (questionData) => {
            setQuestions(prev => [...prev, questionData.payload.content]);
          });

        } catch (error) {
          console.error("Error initializing Symbl:", error);
          alert("Failed to establish a connection to Symbl. Please try again.");
        }
      }
    };

    initializeSymbl();

    return () => {
      if (connection) {
        connection.stopProcessing();
        connection.disconnect();
      }
    };
  }, []);

  return (
    <div>
      <h1>Real-time Conversation</h1>
      <h2>Transcript:</h2>
      <pre>{transcript}</pre>
      <h2>Topics:</h2>
      <ul>
        {topics.map((topic, index) => (
          <li key={index}>{topic}</li>
        ))}
      </ul>
      <h2>Questions:</h2>
      <ul>
        {questions.map((question, index) => (
          <li key={index}>{question}</li>
        ))}
      </ul>
    </div>
  );
};

export default SymblConversation;

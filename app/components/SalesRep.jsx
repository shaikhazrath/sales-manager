'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Symbl } from '@symblai/symbl-web-sdk';
import axios from 'axios';

const SalesRep = () => {
  const [transcript, setTranscript] = useState('');
  const [aiRes, setAiRes] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const connectionRef = useRef(null);

  const speakText = useCallback((text) => {
    try {
      if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = 1;
        utterance.onstart = () => {
          setIsAiSpeaking(true);
        };

        utterance.onend = () => {
          setIsAiSpeaking(false);
        };

        synth.speak(utterance);
      } else {
        setError('Sorry, your browser does not support speech synthesis.');
      }
    } catch (error) {
      console.error('Error with browser Text-to-Speech:', error);
      setError('Failed to generate or play speech.');
      setIsAiSpeaking(false);
    }
  }, []);

  const geminiAi = async (conv) => {
    try {
      const namespaceid = localStorage.getItem('id');
      const res = await axios.post(`/api/genai`, { conv, namespaceid });
      setAiRes(res.data.response);
      speakText(res.data.response);
    } catch (error) {
      console.error(error);
      setError('Failed to get AI response or generate speech.');
    }
  };

  const startListening = async () => {
    if (isListening) return;

    try {
      const accessToken = process.env.NEXT_PUBLIC_SYMBL_API;
      const symbl = new Symbl({ accessToken });

      const connection = await symbl.createConnection();
      await connection.startProcessing({
        insightTypes: ['question', 'action_item', 'follow_up'],
        config: { encoding: 'OPUS' },
        speaker: { userId: 'user@example.com', name: 'User' },
      });

      connectionRef.current = connection;
      setIsListening(true);


      connection.on('speech_recognition', (speechData) => {
        const { punctuated } = speechData;
        setTranscript((prev) => `${punctuated.transcript}\n`);
        setIsSpeaking(true);
      });

      connection.on('message', () => {
        setIsSpeaking(false);
      });
    } catch (error) {
      console.error('Error initializing Symbl:', error);
      setError('Failed to establish a connection to Symbl. Please try again.');
    }
  };

  const stopListening = async () => {
    if (!isListening) return;
    geminiAi(transcript);

    try {
      if (connectionRef.current) {
        await connectionRef.current.stopProcessing();
        await connectionRef.current.disconnect();
        connectionRef.current = null;
      }
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping Symbl connection:', error);
      setError('Failed to stop the Symbl connection. Please try again.');
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">The AI Sales Engineer</h1>
      <div className="mb-4 border-b pb-4">
        <h2 className="text-xl font-semibold mb-2">Transcript:</h2>
        <div className="space-y-4">
          {/* User's message */}
          <div className="flex items-start">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex justify-center items-center mr-2">
              U
            </div>
            <div className="bg-blue-100 text-black p-3 rounded-lg shadow">
              <pre className="whitespace-pre-wrap">{transcript}</pre>
            </div>
          </div>

          {/* AI's response */}
          <div className="flex items-start justify-end">
            <div className="bg-gray-200 text-black p-3 rounded-lg shadow max-w-xs">
              <pre className="whitespace-pre-wrap">{aiRes}</pre>
            </div>
            <div className="w-10 h-10 bg-gray-500 text-white rounded-full flex justify-center items-center ml-2">
              AI
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mb-4 flex justify-center space-x-4">
        <button
          onClick={startListening}
          disabled={isListening}
          className={`px-4 py-2 rounded ${
            isListening ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
          } text-white font-bold`}
        >
          Start Listening
        </button>
        <button
          onClick={stopListening}
          disabled={!isListening}
          className={`px-4 py-2 rounded ${
            !isListening ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
          } text-white font-bold`}
        >
          Stop Listening
        </button>
      </div>
    </div>
  );
};

export default SalesRep;

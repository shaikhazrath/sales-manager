'use client';

import React, { useState } from 'react';
import axios from 'axios';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message to chat
    const userMessage = { type: 'user', text: inputText };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const namespaceid = localStorage.getItem('id');
      const res = await axios.post(`/api/genai`, { conv: inputText, namespaceid });

      // Add AI response to chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'ai', text: res.data.response },
      ]);
    } catch (error) {
      console.error(error);
      setError('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center">
          <h1 className="text-2xl font-bold">AI Sales Engineer</h1>
        </div>

        {/* Chat messages display */}
        <div className="p-4 h-[400px] overflow-y-auto border-b border-gray-200">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center my-10">Start a conversation with the AI Sales Engineer</p>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  {message.type === 'ai' && (
                    <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex justify-center items-center mr-2">
                      AI
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg shadow max-w-xs ${
                      message.type === 'ai' ? 'bg-gray-200 text-black' : 'bg-blue-100 text-black'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap">{message.text}</pre>
                  </div>
                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex justify-center items-center ml-2">
                      U
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex justify-center items-center mr-2">
                    AI
                  </div>
                  <div className="bg-gray-200 text-black p-3 rounded-lg shadow">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && <div className="text-red-500 text-center p-2">{error}</div>}

        {/* Input area */}
        <div className="p-4 flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="2"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className={`px-4 py-2 rounded ${
              isLoading || !inputText.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-bold self-end transition-colors duration-300`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
'use client';

import React, { useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import ShinyButton from '@/components/ui/shiny-button';
import ChatAssistant from '@/components/SalesRep';

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [conv, setConv] = useState(false);
  const [urls, setUrls] = useState(null);

  const handleSubmit = async () => {
    if (!url.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(`/api/webscrape`, { url });
      setUrls(res.data.allurls); // Assuming `allurls` is an array of URLs
      localStorage.setItem('id', res.data.transcriptId);
      setConv(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {!conv ? (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Enter Website URL</h1>
          <Input
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., https://stackzero.in"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="mt-6">
            <ShinyButton
              className="w-full py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all duration-300"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 mx-auto text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              ) : (
                'Submit'
              )}
            </ShinyButton>
          </div>
        </div>
      ) : (
        <div>
          <ChatAssistant />
          {/* Render all URLs */}
          {urls && urls.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Scraped URLs:</h2>
              <ul>
                {urls.map((data, index) => (
                  <li key={index} className="text-blue-500 underline">
                    <a href={data} target="_blank" rel="noopener noreferrer">
                      {data}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No URLs found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
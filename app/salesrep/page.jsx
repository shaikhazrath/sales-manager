'use client';

import React, { useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import ShinyButton from '@/components/ui/shiny-button';
import ShimmerButton from '@/components/ui/shimmer-button';

const SalesRep = dynamic(() => import('../components/SalesRep'), { ssr: false });

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [conv, setConv] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log(url);
      const res = await axios.post(`/api/webscrape`, {
        url,
      });
      localStorage.setItem('id', res.data);
      setConv(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  return (
    <div className="">
      <div className="px-10 py-10 flex justify-center flex-col items-center gap-4 pt-5">
        <h1 className="text-2xl font-bold">Enter the Website Url</h1>
        <Input
          className="md:w-1/3"
          placeholder="url eg:- https://www.tenali.ai"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="z-10 flex items-center justify-center">
          <ShimmerButton className="shadow-2xl" onClick={() => handleSubmit()}>
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
              Submit
            </span>
          </ShimmerButton>
        </div>
        {loading && (
          <h1 className="text-xl text-center font-medium flex items-center">
            <svg
              className="animate-spin h-5 w-5 mr-3 text-black"
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
            Please wait, this may take a few seconds....
          </h1>
        )}
      </div>

      {conv && <SalesRep />}
    </div>
  );
};

export default Page;

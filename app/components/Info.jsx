'use client'
import React, { useState } from 'react'
import axios from 'axios'

const Info = () => { 
    const [url,seturl] = useState('')
    const handleSubmit = async()=>{
        try {
        //    const data = webscraper(url)
        const res = await axios.post(`/api/webscrape`, {
            url,
          });
           console.log(res)
        } catch (error) {
            console.log(error)
        }
    }
  return (
    <div>
    <input type="text" value={url} onChange={e=>seturl(e.target.value)}  />
    <button onClick={()=>handleSubmit()}>submit</button>
    </div>
  )
}

export default Info
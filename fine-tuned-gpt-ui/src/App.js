// src/App.js
import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box } from '@mui/material';
import { motion } from 'framer-motion';
import TagInput from './TagInput';
import TweetBubblesContainer from './TweetBubblesContainer';
import './App.css';

function App() {
  const [tags, setTags] = useState([]);
  const [tweetCount, setTweetCount] = useState(10);
  const [progress, setProgress] = useState([]);
  const [step, setStep] = useState('input'); // 'input', 'logging', 'complete'
  const [tweets, setTweets] = useState([]); // Store fetched tweets

  const pollForStatus = (processId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/process-status/${processId}`);
        const statusData = await res.json();

        if (statusData.status === 'complete') {
          clearInterval(interval);
          setStep('complete');
          setTweets(statusData.tweets); // Store the scraped tweets
        } else if (statusData.status === 'error') {
          clearInterval(interval);
          setProgress([`Error: ${statusData.error}`]);
          setStep('input');
        }
      } catch (error) {
        console.error('Error polling process status:', error);
      }
    }, 2000);
  };

  const API_BASE_URL = "http://127.0.0.1:8080"; // Ensure this matches your backend

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Submit button clicked!");

    setStep("logging");
    setProgress(["Starting scraping..."]);

    if (tags.length === 0) {
      console.error("❌ No username provided! Aborting request.");
      setProgress(["Error: No username provided."]);
      return;
    }

    console.log("📤 Sending API request to backend...");
    console.log("Tags array:", tags);
    console.log("First tag (username):", tags[0]);
    console.log("Tweet count:", tweetCount);

    try {
      const res = await fetch(`${API_BASE_URL}/api/start-process`, {  // ✅ Updated API URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: tags[0], tweet_count: tweetCount }),
      });

      console.log("📥 Received response from backend...");
      console.log("Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ API Error: ${errorText}`);
        setProgress([`Error: ${errorText}`]);
        return;
      }

      const data = await res.json();
      console.log("✅ API call successful! Received process ID:", data.process_id);

      setProgress(["Scraping in progress..."]);
      pollForStatus(data.process_id);
    } catch (error) {
      console.error("❌ Error during fetch request:", error);
      setProgress(["Error: " + error.message]);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
        <TweetBubblesContainer />
        {step === 'input' && (
          <Paper elevation={6} sx={{ p: 4, backgroundColor: 'background.paper', position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" align="center">Custom AI Agent</Typography>
            <TagInput tags={tags} setTags={setTags} />
            <Box sx={{ mt: 2, mb: 2 }}>
              <TextField
                label="Number of tweets to pull (10-1000)"
                type="number"
                fullWidth
                inputProps={{ min: 10, max: 1000 }}
                value={tweetCount}
                onChange={(e) => setTweetCount(e.target.value)}
                variant="outlined"
              />
            </Box>
            <Button variant="contained" color="primary" fullWidth onClick={handleSubmit} sx={{ py: 1.5, mt: 2 }}>
              Submit
            </Button>
          </Paper>
        )}

        {step === 'logging' && (
          <Paper elevation={6} sx={{ p: 4, mt: 4, backgroundColor: 'background.paper', position: 'relative', zIndex: 1 }}>
            <Typography variant="h5">Processing...</Typography>
            {progress.map((msg, index) => (
              <Typography key={index} variant="body1" sx={{ mb: 1 }}>{msg}</Typography>
            ))}
          </Paper>
        )}

        {step === 'complete' && (
          <Paper elevation={6} sx={{ p: 4, mt: 4, backgroundColor: 'background.paper', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" gutterBottom>Scraping Complete!</Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', textAlign: 'left' }}>
              {tweets.length > 0 ? tweets.map((tweet, index) => (
                <Typography key={index} variant="body1" sx={{ mb: 1 }}>
                  {tweet.text}
                </Typography>
              )) : <Typography>No tweets found.</Typography>}
            </Box>
          </Paper>
        )}
      </Container>
    </motion.div>
  );
}

export default App;

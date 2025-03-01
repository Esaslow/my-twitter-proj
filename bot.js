// Define the target terms for tweet search
const targetTerms = [
    '@AlloraNetwork',
    'Allora Network',
    '$allo',
    '$nick',
    'Nick Emmons',
    "Allora is the Intelligence",
    "Allora is AI"
  ];
  
  require('dotenv').config(); // Load environment variables
  
  const { Scraper, SearchMode } = require('agent-twitter-client');
  
  // Helper function to fetch detailed tweet data using the v1 endpoint.
  async function enrichTweetWithDetails(scraper, tweet) {
    try {
      // Use getTweet (v1) to get more details such as tweet text and timestamp.
      const detailedTweet = await scraper.getTweet(tweet.id);
      return detailedTweet;
    } catch (error) {
      console.error(`Error fetching details for tweet ${tweet.id}:`, error);
      return tweet; // fallback to the original tweet if detailed data fails
    }
  }
  
  async function searchTweetsForTerm(scraper, term) {
    try {
      const tweetGenerator = await scraper.searchTweets(term, 20, SearchMode.Latest);
      console.log(`Raw result for ${term}:`, tweetGenerator);
  
      // Convert async generator to an array with a timeout and max tweet count.
      const tweets = [];
      const maxTweets = 20;
      const timeoutMs = 5000; // Stop waiting after 5 seconds.
      const startTime = Date.now();
      
      for await (const tweet of tweetGenerator) {
        tweets.push(tweet);
        console.log(`Received tweet ${tweet.id} for term: ${term}`);
        if (tweets.length >= maxTweets || (Date.now() - startTime) > timeoutMs) {
          console.log(`Stopping tweet collection for term: ${term} after ${tweets.length} tweets or timeout.`);
          break;
        }
      }
      
      // Enrich each tweet with detailed data (including text and timestamp)
      const enrichedTweets = [];
      for (const tweet of tweets) {
        const detailedTweet = await enrichTweetWithDetails(scraper, tweet);
        enrichedTweets.push(detailedTweet);
      }
      
      // Log details of each enriched tweet for debugging
      enrichedTweets.forEach(tweet => {
        console.log(`Tweet Text: "${tweet.text}" | ID: ${tweet.id} | Created At: ${tweet.created_at}`);
      });
      
      console.log(`Found ${enrichedTweets.length} tweets for term: ${term}`);
      return enrichedTweets;
    } catch (error) {
      console.error(`Error searching tweets for ${term}:`, error);
      return [];
    }
  }
  
  // Processes a single tweet: likes and retweets it, then waits a bit.
  async function processTweet(scraper, tweet) {
    try {
      await scraper.likeTweet(tweet.id);
      await scraper.retweet(tweet.id);
      console.log(`Processed tweet ${tweet.id}`);
      // Pause for 2 seconds between processing tweets.
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error processing tweet ${tweet.id}:`, error);
    }
  }
  
  // Integrates all target terms: searches and processes tweets for each term sequentially.
  async function processAllTerms(scraper) {
    for (const term of targetTerms) {
      console.log(`Searching tweets for: ${term}`);
      const tweets = await searchTweetsForTerm(scraper, term);
      // Process tweets one by one sequentially.
      for (const tweet of tweets) {
        await processTweet(scraper, tweet);
      }
      console.log(`Finished processing tweets for: ${term}`);
    }
  }
  
  // Main function: logs in, processes tweets immediately, and then schedules periodic processing.
  async function runBot() {
    const scraper = new Scraper();
    try {
      await scraper.login(
        process.env.TWITTER_USERNAME,
        process.env.TWITTER_PASSWORD,
        process.env.TWITTER_EMAIL,
        process.env.TWITTER_API_KEY,
        process.env.TWITTER_API_SECRET_KEY,
        process.env.TWITTER_ACCESS_TOKEN,
        process.env.TWITTER_ACCESS_TOKEN_SECRET
      );
      console.log('Logged in successfully!');
  
      // Immediately process all terms on startup.
      await processAllTerms(scraper);
  
      // Then schedule the bot to run every 5 minutes.
      setInterval(async () => {
        console.log('Running scheduled tweet processing');
        await processAllTerms(scraper);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Error during bot execution:', error);
    }
  }
  
  runBot();
  
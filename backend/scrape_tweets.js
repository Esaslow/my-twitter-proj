// scrape_tweets.js
require('dotenv').config();
const { Scraper } = require('agent-twitter-client');

async function scrapeTweets(username, tweetCount) {
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

    // Log messages to stderr (does not interfere with JSON output)
    console.error("Login successful! Starting tweet scrape for:", username);

    // Get the async generator for tweets
    const tweetGenerator = scraper.getTweets(username, tweetCount);
    const tweetsArray = [];

    // Iterate over the async generator and collect tweets
    for await (const tweet of tweetGenerator) {
      tweetsArray.push(tweet);
    }

    // Log the tweet texts to stderr (debugging)
    console.error("Tweet texts:");
    tweetsArray.forEach(tweet => console.error(tweet.text));

    // Output only JSON to stdout (this is crucial for FastAPI to parse it)
    console.log(JSON.stringify(tweetsArray));

  } catch (error) {
    console.error("Error during tweet scraping:", error);
    process.exit(1); // Exit with an error code to signal failure
  }
}

// Get command line arguments: username and tweetCount
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node scrape_tweets.js <username> <tweetCount>");
  process.exit(1);
}

const username = args[0];
const tweetCount = parseInt(args[1], 10);

scrapeTweets(username, tweetCount);

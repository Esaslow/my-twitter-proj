// test_login.js
require('dotenv').config();
const { Scraper } = require('agent-twitter-client');

async function testLogin() {
  const scraper = new Scraper();
  try {
    await scraper.login(
      process.env.TWITTER_USERNAME,         // Use plain username without "@"
      process.env.TWITTER_PASSWORD,
      process.env.TWITTER_EMAIL,
      process.env.TWITTER_API_KEY,
      process.env.TWITTER_API_SECRET_KEY,
      process.env.TWITTER_ACCESS_TOKEN,
      process.env.TWITTER_ACCESS_TOKEN_SECRET
    );
    console.log("Login successful!");
  } catch (error) {
    console.error("Login failed:", error);
  }
}

testLogin();

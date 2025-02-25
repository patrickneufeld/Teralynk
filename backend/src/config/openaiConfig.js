require("dotenv").config(); // Load environment variables
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Add your OpenAI API key in .env
});

const openai = new OpenAIApi(configuration);

module.exports = openai;


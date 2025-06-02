await import("dotenv.js").config(); // Load environment variables
const { Configuration, OpenAIApi } = await import("openai.js");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Add your OpenAI API key in .env
});

const openai = new OpenAIApi(configuration);

export default openai;


import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Ensure Redis URL is Loaded
const { REDIS_URL } = process.env;
if (!REDIS_URL) {
  console.error("❌ ERROR: Missing REDIS_URL in environment variables.");
  process.exit(1);
}

// Redis Channels
const AI_QUERY_CHANNEL = "ai_query_channel";
const AI_RESPONSE_CHANNEL = "ai_response_channel";
const AI_UPDATE_CHANNEL = "ai_update_channel"; // Added for AI updates

class RedisPubSub {
  constructor() {
    // Initialize Redis clients
    this.publisher = createClient({ url: REDIS_URL });
    this.subscriber = createClient({ url: REDIS_URL });

    // Bind error handlers
    this.publisher.on("error", (err) => console.error("❌ Redis Publisher Error:", err));
    this.subscriber.on("error", (err) => console.error("❌ Redis Subscriber Error:", err));

    // Initialize connection
    this.initialize();
  }

  /**
   * Initialize Redis Clients
   */
  async initialize() {
    try {
      // Connect to Redis
      await this.publisher.connect();
      await this.subscriber.connect();

      console.log("✅ Redis Pub/Sub Connected Successfully.");
    } catch (error) {
      console.error("❌ Redis Connection Failed:", error);
      process.exit(1); // Exit if Redis connection fails
    }
  }

  /**
   * Publish AI Query to Redis Channel
   * @param {Object} message - AI query data
   */
  async publishAIQuery(message) {
    try {
      await this.publisher.publish(AI_QUERY_CHANNEL, JSON.stringify(message));
      console.log(`📢 AI Query Published: ${message.query}`);
    } catch (error) {
      console.error("❌ Error Publishing AI Query:", error);
    }
  }

  /**
   * Subscribe to AI Query Channel
   * @param {Function} processFunction - Callback function to process AI queries
   */
  async subscribeToAIQueries(processFunction) {
    try {
      await this.subscriber.subscribe(AI_QUERY_CHANNEL, async (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          console.log(`📩 AI Query Received: ${parsedMessage.query}`);

          await processFunction(parsedMessage);
        } catch (error) {
          console.error("❌ Error Processing AI Query:", error);
        }
      });

      console.log(`🔄 Subscribed to AI Query Channel: ${AI_QUERY_CHANNEL}`);
    } catch (error) {
      console.error("❌ Error Subscribing to AI Query Channel:", error);
    }
  }

  /**
   * Publish AI Response Back to Clients
   * @param {Object} response - AI response data
   */
  async publishAIResponse(response) {
    try {
      await this.publisher.publish(AI_RESPONSE_CHANNEL, JSON.stringify(response));
      console.log(`📢 AI Response Published: ${response.result}`);
    } catch (error) {
      console.error("❌ Error Publishing AI Response:", error);
    }
  }

  /**
   * Subscribe to AI Responses
   * @param {Function} processFunction - Callback function to process AI responses
   */
  async subscribeToAIResponses(processFunction) {
    try {
      await this.subscriber.subscribe(AI_RESPONSE_CHANNEL, async (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          console.log(`📩 AI Response Received: ${parsedMessage.result}`);

          await processFunction(parsedMessage);
        } catch (error) {
          console.error("❌ Error Processing AI Response:", error);
        }
      });

      console.log(`🔄 Subscribed to AI Response Channel: ${AI_RESPONSE_CHANNEL}`);
    } catch (error) {
      console.error("❌ Error Subscribing to AI Response Channel:", error);
    }
  }

  /**
   * Publish AI Updates (Self-Improvement Feature)
   * @param {Object} updateData - AI update payload
   */
  async publishAIUpdate(updateData) {
    try {
      await this.publisher.publish(AI_UPDATE_CHANNEL, JSON.stringify(updateData));
      console.log(`📢 AI Update Published: ${updateData.update}`);
    } catch (error) {
      console.error("❌ Error Publishing AI Update:", error);
    }
  }

  /**
   * Subscribe to AI Updates (Self-Learning System)
   * @param {Function} processFunction - Callback function to process AI updates
   */
  async subscribeToAIUpdates(processFunction) {
    try {
      await this.subscriber.subscribe(AI_UPDATE_CHANNEL, async (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          console.log(`📩 AI Update Received: ${parsedMessage.update}`);

          await processFunction(parsedMessage);
        } catch (error) {
          console.error("❌ Error Processing AI Update:", error);
        }
      });

      console.log(`🔄 Subscribed to AI Update Channel: ${AI_UPDATE_CHANNEL}`);
    } catch (error) {
      console.error("❌ Error Subscribing to AI Update Channel:", error);
    }
  }
}

// Export Redis Pub/Sub Instance
const redisPubSub = new RedisPubSub();
export default redisPubSub;
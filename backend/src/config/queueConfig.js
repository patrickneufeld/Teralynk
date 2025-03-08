// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/config/queueConfig.js

import amqp from "amqplib";
import redisPubSub from "./redisPubSub.js";
import { SQSClient } from "@aws-sdk/client-sqs"; // Import SQS Client
import dotenv from "dotenv";

dotenv.config();

// ✅ Ensure Required Environment Variables
const { RABBITMQ_URL, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
if (!RABBITMQ_URL) {
  console.error("❌ ERROR: Missing RABBITMQ_URL in environment variables.");
  process.exit(1);
}

// ✅ Define Queue Names
const QUEUE_NAME = "ai_query_queue";
const AI_UPDATE_QUEUE = "ai_update_queue";

// ✅ Initialize SQS Client
const sqsClient = new SQSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

class QueueConfig {
  constructor() {
    this.channel = null;
    this.connection = null;
  }

  /**
   * ✅ Initialize RabbitMQ Connection & Channel
   */
  async initializeQueue() {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(QUEUE_NAME, { durable: true });
      await this.channel.assertQueue(AI_UPDATE_QUEUE, { durable: true });

      console.log(`✅ RabbitMQ Connected. Queues Ready: ${QUEUE_NAME}, ${AI_UPDATE_QUEUE}`);
    } catch (error) {
      console.error("❌ RabbitMQ Initialization Failed:", error);
      process.exit(1);
    }
  }

  /**
   * ✅ Send AI Query to RabbitMQ Queue
   * @param {Object} message - AI query data
   */
  async sendAIQueryToQueue(message) {
    try {
      if (!this.channel) {
        console.error("❌ RabbitMQ Channel is not initialized.");
        return;
      }

      this.channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });

      console.log(`📩 AI Query Sent to RabbitMQ Queue: ${message.query}`);
    } catch (error) {
      console.error("❌ Error Sending AI Query to RabbitMQ Queue:", error);
    }
  }

  /**
   * ✅ Process AI Queries from RabbitMQ Queue
   * @param {Function} processFunction - Function to process incoming queries
   */
  async processQueue(processFunction) {
    try {
      if (!this.channel) {
        console.error("❌ RabbitMQ Channel is not initialized.");
        return;
      }

      await this.channel.consume(
        QUEUE_NAME,
        async (msg) => {
          if (msg !== null) {
            const messageContent = JSON.parse(msg.content.toString());
            console.log(`🚀 Processing AI Query from RabbitMQ: ${messageContent.query}`);

            await processFunction(messageContent);
            this.channel.ack(msg);
          }
        },
        { noAck: false }
      );

      console.log(`🔄 AI Query Processing Started for Queue: ${QUEUE_NAME}`);
    } catch (error) {
      console.error("❌ Error Processing AI Query Queue:", error);
    }
  }

  /**
   * ✅ Process AI Updates from RabbitMQ Queue
   */
  async processQueuedAIUpdates() {
    try {
      if (!this.channel) {
        console.error("❌ RabbitMQ Channel is not initialized.");
        return;
      }

      await this.channel.consume(
        AI_UPDATE_QUEUE,
        async (msg) => {
          if (msg !== null) {
            const updateContent = JSON.parse(msg.content.toString());
            console.log(`🔄 Processing AI Update from RabbitMQ: ${updateContent.update}`);

            // Process AI update logic here (e.g., applying AI improvements)
            await applyAIUpdate(updateContent);

            this.channel.ack(msg);
          }
        },
        { noAck: false }
      );

      console.log("✅ AI Update Processing Started.");
    } catch (error) {
      console.error("❌ Error Processing AI Updates:", error);
    }
  }

  /**
   * ✅ Send AI Query to Redis Pub/Sub
   * @param {Object} queryData - AI query payload
   */
  async sendAIQueryToRedis(queryData) {
    try {
      await redisPubSub.publishAIQuery(queryData);
      console.log(`📢 AI Query Published to Redis: ${queryData.query}`);
    } catch (error) {
      console.error("❌ Error Sending AI Query to Redis Pub/Sub:", error);
    }
  }

  /**
   * ✅ Send AI Update to Redis Pub/Sub
   * @param {Object} updateData - AI update payload
   */
  async sendAIUpdateToRedis(updateData) {
    try {
      await redisPubSub.publishAIUpdate(updateData);
      console.log(`📢 AI Update Published to Redis: ${updateData.update}`);
    } catch (error) {
      console.error("❌ Error Sending AI Update to Redis Pub/Sub:", error);
    }
  }

  /**
   * ✅ Start Listening for AI Queries via Redis
   */
  async startRedisAIQueryListener() {
    redisPubSub.subscribeToAIQueries(async (queryData) => {
      console.log(`📩 AI Query Received from Redis: ${queryData.query}`);

      // Forward AI query to RabbitMQ for processing
      await this.sendAIQueryToQueue(queryData);
    });

    console.log("✅ AI Query Listener Started via Redis.");
  }

  /**
   * ✅ Start Listening for AI Responses via Redis
   */
  async startRedisAIResponseListener() {
    redisPubSub.subscribeToAIResponses((response) => {
      console.log(`📩 AI Response Received from Redis: ${response.result}`);
    });

    console.log("✅ AI Response Listener Started via Redis.");
  }

  /**
   * ✅ Start Listening for AI Updates via Redis
   */
  async startRedisAIUpdateListener() {
    redisPubSub.subscribeToAIUpdates(async (updateData) => {
      console.log(`📩 AI Update Received from Redis: ${updateData.update}`);

      // Forward AI update to RabbitMQ for processing
      await this.sendAIQueryToQueue(updateData);
    });

    console.log("✅ AI Update Listener Started via Redis.");
  }
}

// ✅ Export Queue Instance & Functionality
const queueConfig = new QueueConfig();
const sendAIQueryToQueue = queueConfig.sendAIQueryToQueue.bind(queueConfig);
const processQueuedAIUpdates = queueConfig.processQueuedAIUpdates.bind(queueConfig);

export { queueConfig, sendAIQueryToQueue, processQueuedAIUpdates, sqsClient };

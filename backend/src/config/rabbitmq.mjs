// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/config/rabbitmq.js

import amqp from "amqplib";
import dotenv from "dotenv";
import { SQSClient } from "@aws-sdk/client-sqs";
import redisPubSub from "./redisPubSub.mjs";

dotenv.config();

// ✅ Validate Environment Variables
const { RABBITMQ_URL, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

if (!RABBITMQ_URL) {
  console.error("❌ ERROR: RABBITMQ_URL not defined.");
  process.exit(1);
}

// ✅ Queue Names
const QUEUE_NAME = "ai_query_queue";
const AI_UPDATE_QUEUE = "ai_update_queue";

// ✅ SQS Client
const sqsClient = new SQSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

class RabbitMQManager {
  constructor() {
    this.channel = null;
    this.connection = null;
  }

  async initialize() {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(QUEUE_NAME, { durable: true });
      await this.channel.assertQueue(AI_UPDATE_QUEUE, { durable: true });

      console.log(`✅ RabbitMQ initialized: ${QUEUE_NAME}, ${AI_UPDATE_QUEUE}`);
    } catch (err) {
      console.error("❌ RabbitMQ initialization failed:", err.message);
      process.exit(1);
    }
  }

  async sendToQueue(queueName, message) {
    if (!this.channel) {
      console.error("❌ RabbitMQ channel not initialized.");
      return;
    }
    try {
      const buffer = Buffer.from(JSON.stringify(message));
      this.channel.sendToQueue(queueName, buffer, { persistent: true });
      console.log(`📤 Sent message to ${queueName}`);
    } catch (err) {
      console.error("❌ Failed to send message to queue:", err.message);
    }
  }

  async consumeQueue(queueName, handler) {
    if (!this.channel) {
      console.error("❌ RabbitMQ channel not initialized.");
      return;
    }

    await this.channel.consume(
      queueName,
      async (msg) => {
        if (msg !== null) {
          try {
            const data = JSON.parse(msg.content.toString());
            await handler(data);
            this.channel.ack(msg);
          } catch (err) {
            console.error(`❌ Error processing message from ${queueName}:`, err.message);
            this.channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );

    console.log(`🔄 Listening on queue: ${queueName}`);
  }

  async sendAIQuery(message) {
    await this.sendToQueue(QUEUE_NAME, message);
  }

  async sendAIUpdate(update) {
    await this.sendToQueue(AI_UPDATE_QUEUE, update);
  }

  async processQueuedAIUpdates(handler) {
    await this.consumeQueue(AI_UPDATE_QUEUE, handler);
  }

  async publishToRedis(channel, message) {
    try {
      await redisPubSub.publish(channel, message);
      console.log(`📡 Published to Redis (${channel}):`, message);
    } catch (err) {
      console.error("❌ Redis publish failed:", err.message);
    }
  }

  async listenToRedis(channel, handler) {
    redisPubSub.subscribe(channel, async (message) => {
      console.log(`📥 Received from Redis (${channel}):`, message);
      await handler(message);
    });
    console.log(`🟢 Subscribed to Redis channel: ${channel}`);
  }
}

const rabbitmq = new RabbitMQManager();
const initializeRabbitMQ = () => rabbitmq.initialize();

// ✅ Individual exports for compatibility
const sendAIQueryToQueue = (msg) => rabbitmq.sendAIQuery(msg);
const processQueuedAIUpdates = (handler) => rabbitmq.processQueuedAIUpdates(handler);

export {
  rabbitmq,
  initializeRabbitMQ,
  sqsClient,
  sendAIQueryToQueue,
  processQueuedAIUpdates
};

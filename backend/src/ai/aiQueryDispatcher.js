// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/aiQueryDispatcher.js

import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { processAIQuery } from "./aiIntegration.js";
import { sqsClient, redisClient } from "../config/queueConfig.js";

/**
 * ✅ AI Query Dispatcher
 * Handles AI queries from multiple sources (AWS SQS, Redis Pub/Sub).
 */

// ✅ AWS SQS Queue URL from environment variables
const AI_QUERY_QUEUE = process.env.SQS_AI_QUERY_URL;

if (!AI_QUERY_QUEUE) {
  console.error("❌ ERROR: Missing SQS_AI_QUERY_URL environment variable.");
  process.exit(1);
}

/**
 * ✅ Process AI Queries from AWS SQS
 * Pulls messages from SQS, processes queries, and deletes them after processing.
 */
export const processSQSQueries = async () => {
  try {
    console.log("📡 Listening for AI Queries via AWS SQS...");
    
    while (true) { // Continuous polling
      const { Messages } = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: AI_QUERY_QUEUE,
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 10, // Reduce API call overhead
      }));

      if (Messages) {
        for (const message of Messages) {
          try {
            const query = JSON.parse(message.Body);
            console.log(`📨 Processing AI Query from SQS: ${query.query}`);

            await processAIQuery(query);

            // ✅ Delete processed message from SQS
            await sqsClient.send(new DeleteMessageCommand({
              QueueUrl: AI_QUERY_QUEUE,
              ReceiptHandle: message.ReceiptHandle,
            }));

            console.log(`✅ Query Processed & Removed from SQS: ${query.query}`);
          } catch (error) {
            console.error("❌ Error processing AI query from SQS:", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error processing SQS messages:", error);
  }
};

/**
 * ✅ Process AI Queries from Redis Pub/Sub
 * Subscribes to Redis "ai_query" channel and processes queries in real time.
 */
export const processRedisQueries = async () => {
  try {
    console.log("📡 Listening for AI Queries via Redis Pub/Sub...");
    
    redisClient.subscribe("ai_query", (err, count) => {
      if (err) {
        console.error("❌ Error subscribing to Redis Pub/Sub:", err);
      } else {
        console.log(`✅ Subscribed to Redis AI Query Channel. Active listeners: ${count}`);
      }
    });

    redisClient.on("message", async (channel, message) => {
      if (channel === "ai_query") {
        try {
          const query = JSON.parse(message);
          console.log(`📨 Processing AI Query from Redis: ${query.query}`);
          await processAIQuery(query);
        } catch (error) {
          console.error("❌ Error processing AI query from Redis:", error);
        }
      }
    });
  } catch (error) {
    console.error("❌ Error initializing Redis Pub/Sub listener:", error);
  }
};

/**
 * ✅ Dispatch AI Query to Multiple AI Services
 * Used for direct AI queries without queuing.
 * @param {string} query - User's AI request.
 * @param {Array<Object>} aiServices - List of AI services.
 * @returns {Array<Promise>} - AI responses.
 */
export const dispatchQuery = async (query, aiServices) => {
  console.log(`📨 Dispatching AI Query: "${query}" to multiple AI services.`);
  
  const responses = await Promise.all(aiServices.map(ai => ai.respond(query)));
  console.log(`✅ AI Query Responses Received:`, responses);
  
  return responses;
};

// ✅ Start AI Query Listeners
processSQSQueries();
processRedisQueries();

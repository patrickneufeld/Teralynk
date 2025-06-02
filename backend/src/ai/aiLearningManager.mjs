import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.mjs';
import { sendAIQueryToQueue, processQueuedAIUpdates, sqsClient } from '../config/rabbitmq.mjs';
import { ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { logInfo, logError } from '../utils/logger.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AILearningManager {
  constructor() {
    this.optimizationLogPath = path.join(__dirname, 'aiOptimizations.json');
    this.aiErrorLogPath = path.join(__dirname, 'aiErrors.json');
  }

  async init() {
    if (!fs.existsSync(this.optimizationLogPath)) {
      fs.writeFileSync(this.optimizationLogPath, JSON.stringify({ updates: [] }, null, 2));
    }
    if (!fs.existsSync(this.aiErrorLogPath)) {
      fs.writeFileSync(this.aiErrorLogPath, JSON.stringify({ errors: [] }, null, 2));
    }
    logInfo("✅ AILearningManager initialized");
    return this;
  }

  async logAILearning(userId, action, details) {
    try {
      await db.query(
        'INSERT INTO ai_logs (user_id, action, details, timestamp) VALUES ($1, $2, $3, NOW())',
        [userId, action, JSON.stringify(details)]
      );
      logInfo(`✅ AI Learning Logged: ${action} - User: ${userId}`);
    } catch (error) {
      logError('❌ Error logging AI learning:', error.message);
    }
  }

  async analyzeAndUpdateAI() {
    try {
      const pastInteractions = await db.query(
        'SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 50'
      );
      if (!pastInteractions.rows.length) return;

      await sendAIQueryToQueue({
        query: 'Analyze past AI interactions and suggest optimizations:',
        data: pastInteractions.rows,
      });

      logInfo('✅ AI Query Sent for Self-Analysis.');
    } catch (error) {
      logError('❌ AI Self-Improvement Failed:', error.message);
    }
  }

  async refineAIWithFeedback(userId, aiResponse, success) {
    try {
      await db.query(
        'INSERT INTO ai_feedback (user_id, ai_response, success, timestamp) VALUES ($1, $2, $3, NOW())',
        [userId, JSON.stringify(aiResponse), success]
      );
      logInfo(`📡 AI Feedback Processed - Success: ${success}`);
    } catch (error) {
      logError('❌ AI Feedback Logging Failed:', error.message);
    }
  }

  async handleAIErrors(errorDetails) {
    try {
      const errorLog = JSON.parse(fs.readFileSync(this.aiErrorLogPath, 'utf-8'));
      errorLog.errors.push({ timestamp: new Date(), error: errorDetails });

      fs.writeFileSync(this.aiErrorLogPath, JSON.stringify(errorLog, null, 2));
      logInfo(`⚠️ AI Error Logged. Auto-recovery initiated.`);
      await this.analyzeAndUpdateAI();
    } catch (error) {
      logError('❌ AI Error Handling Failed:', error.message);
    }
  }

  async autoUpdateAI() {
    try {
      if (!fs.existsSync(this.optimizationLogPath)) return;

      const aiOptimizations = JSON.parse(fs.readFileSync(this.optimizationLogPath, 'utf-8'));
      if (!aiOptimizations.updates.length) return;

      for (const update of aiOptimizations.updates) {
        const response = await axios.post(
          'https://api.openai.com/v1/completions',
          {
            model: 'gpt-4',
            prompt: `Update the AI system based on the following improvement:\n\n${update}`,
            max_tokens: 1000,
            temperature: 0.3,
          },
          {
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          }
        );

        const updatedCode = response.data?.choices?.[0]?.text?.trim() || 'No valid updates returned.';
        logInfo(`🚀 AI Auto-Updated Code:\n${updatedCode}`);
        await processQueuedAIUpdates(updatedCode);
      }
    } catch (error) {
      logError('❌ AI Auto-Update Failed:', error.message);
    }
  }

  async processAIMessages() {
    try {
      const AI_SQS_QUEUE = process.env.SQS_AI_LEARNING_URL;
      const { Messages } = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: AI_SQS_QUEUE,
          MaxNumberOfMessages: 5,
        })
      );

      if (Messages) {
        for (const message of Messages) {
          const query = JSON.parse(message.Body);
          logInfo('🔍 Processing AI Message:', query);
          await this.analyzeAndUpdateAI();
        }
      }
    } catch (error) {
      logError('❌ AI Message Processing Failed:', error.message);
    }
  }

  async runFullAISelfImprovement() {
    logInfo('\n🔍 Running Full AI Self-Learning Cycle...\n');
    await this.analyzeAndUpdateAI();
    await this.autoUpdateAI();
    await this.processAIMessages();
  }

  async runAISelfImprovement() {
    await this.runFullAISelfImprovement();
  }
}

const manager = await new AILearningManager().init();
export const logAILearning = manager.logAILearning.bind(manager);
export const runAISelfImprovement = manager.runAISelfImprovement.bind(manager);
export default manager;

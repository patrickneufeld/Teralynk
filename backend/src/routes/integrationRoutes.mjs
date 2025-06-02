// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/integrationRoutes.js

import express from "express";
import { authenticate } from "../middleware/authMiddleware.mjs";
import aiIntegrationManager from "../ai/aiIntegrationManager.mjs";
import aiLearningManager from "../ai/aiLearningManager.mjs";

const router = express.Router();

/**
 * Route: POST /api/integrations/connect
 * Description: AI connects to an external API (Google Drive, Dropbox, OpenAI, etc.).
 */
router.post("/connect", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { serviceName, credentials } = req.body;

  if (!serviceName || !credentials) {
    return res.status(400).json({ error: "Service name and credentials are required." });
  }

  try {
    console.log(`🔗 AI Connecting to ${serviceName}`);

    // AI configures and establishes a connection to the external service
    const connectionResult = await aiIntegrationManager.connectService(userId, serviceName, credentials);
    
    // Log AI learning from API connections
    await aiLearningManager.logAILearning(userId, "api_connected", { serviceName, connectionResult });

    res.status(200).json({ message: "Connected successfully", connectionResult });
  } catch (error) {
    console.error(`Error connecting to ${serviceName}:`, error.message);
    res.status(500).json({ error: `Failed to connect to ${serviceName}.` });
  }
});

/**
 * Route: POST /api/integrations/query
 * Description: AI sends a request to an external API and retrieves a response.
 */
router.post("/query", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { serviceName, query } = req.body;

  if (!serviceName || !query) {
    return res.status(400).json({ error: "Service name and query are required." });
  }

  try {
    console.log(`📡 AI Querying ${serviceName}`);

    // AI interacts with the external API and retrieves results
    const apiResponse = await aiIntegrationManager.queryService(userId, serviceName, query);
    
    // Log AI learning from API interactions
    await aiLearningManager.logAILearning(userId, "api_query", { serviceName, query, apiResponse });

    res.status(200).json({ message: "Query executed successfully", apiResponse });
  } catch (error) {
    console.error(`Error querying ${serviceName}:`, error.message);
    res.status(500).json({ error: `Failed to query ${serviceName}.` });
  }
});

/**
 * Route: POST /api/integrations/disconnect
 * Description: AI disconnects an external service.
 */
router.post("/disconnect", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { serviceName } = req.body;

  if (!serviceName) {
    return res.status(400).json({ error: "Service name is required." });
  }

  try {
    console.log(`🔌 AI Disconnecting from ${serviceName}`);

    // AI removes the service connection
    const disconnectionResult = await aiIntegrationManager.disconnectService(userId, serviceName);
    
    // Log AI learning from disconnections
    await aiLearningManager.logAILearning(userId, "api_disconnected", { serviceName });

    res.status(200).json({ message: "Disconnected successfully", disconnectionResult });
  } catch (error) {
    console.error(`Error disconnecting from ${serviceName}:`, error.message);
    res.status(500).json({ error: `Failed to disconnect from ${serviceName}.` });
  }
});

/**
 * Route: GET /api/integrations/list
 * Description: Retrieve a list of connected APIs.
 */
router.get("/list", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📜 AI Fetching Connected APIs for User: ${userId}`);

    // AI retrieves a list of all connected services
    const connectedServices = await aiIntegrationManager.listConnectedServices(userId);

    res.status(200).json({ message: "Connected services retrieved", connectedServices });
  } catch (error) {
    console.error("Error retrieving connected services:", error.message);
    res.status(500).json({ error: "Failed to retrieve connected services." });
  }
});

export default router;

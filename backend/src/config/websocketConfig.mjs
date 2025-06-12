import { WebSocketServer } from 'ws';
import { logInfo, logError } from "../utils/logger.mjs";

const wss = new WebSocketServer({ noServer: true });

const clients = new Map();

/**
 * ✅ Setup WebSocket Server and Handle Connections
 * @param {http.Server} server - The HTTP server to attach WebSocket to.
 */
export const setupWebSocketServer = (server) => {
  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws, request) => {
    const userId = requestUserIdFromRequest(request);

    if (!userId) {
      ws.close(1008, "Invalid user");
      return;
    }

    clients.set(userId, ws);
    logInfo("WebSocket connection established", { userId });

    ws.on("message", (message) => handleMessage(userId, message));
    ws.on("close", () => handleDisconnect(userId));
  });
};

/**
 * ✅ Extract userId from WebSocket request
 */
const requestUserIdFromRequest = (request) => {
  try {
    const params = new URL(request.url, `http://${request.headers.host}`).searchParams;
    return params.get("userId");
  } catch (error) {
    logError("Failed to extract userId from WebSocket request", error);
    return null;
  }
};

/**
 * ✅ Broadcast updates to all clients in the specified room
 * @param {string} roomId
 * @param {object} update
 */
export const broadcastUpdate = (roomId, update) => {
  for (const [userId, ws] of clients.entries()) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ roomId, ...update }));
    }
  }
  logInfo("Broadcasted update", { roomId, update });
};

/**
 * ✅ Send individual messages to collaborators
 * @param {Array<string>} collaboratorIds
 * @param {object} message
 */
export const notifyCollaborators = async (collaboratorIds = [], message = {}) => {
  try {
    for (const userId of collaboratorIds) {
      const ws = clients.get(userId);
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ event: "notification", ...message }));
      }
    }
    logInfo("Notified collaborators", { collaboratorIds, message });
  } catch (error) {
    logError("Error notifying collaborators", error);
  }
};

/**
 * ✅ Handle received messages from clients
 * @param {string} userId
 * @param {string} message
 */
const handleMessage = (userId, message) => {
  try {
    const data = JSON.parse(message);
    logInfo("Received WebSocket message", { userId, data });
  } catch (error) {
    logError("Error handling WebSocket message", { userId, error });
  }
};

/**
 * ✅ Handle WebSocket disconnect
 * @param {string} userId
 */
const handleDisconnect = (userId) => {
  clients.delete(userId);
  logInfo("WebSocket disconnected", { userId });
};

// ✅ Export WebSocket functions
export default {
  setupWebSocketServer,
  broadcastUpdate,
};

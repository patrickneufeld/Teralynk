// ✅ FILE: /backend/src/controllers/aiGroupsController.js

import db from "../config/db.mjs"; // Assumes Knex or custom DB client
import logger from "../config/logger.mjs";

export const getAIGroups = async (req, res) => {
  try {
    const groups = await db("ai_groups").select("*").orderBy("created_at", "desc");
    res.json({ groups });
  } catch (error) {
    logger.error("❌ Failed to fetch AI groups:", error);
    res.status(500).json({ error: "Failed to fetch AI groups" });
  }
};

export const createAIGroup = async (req, res) => {
  const { name, models } = req.body;

  if (!name || !Array.isArray(models)) {
    return res.status(400).json({ error: "Missing required group name or models array" });
  }

  try {
    const [id] = await db("ai_groups").insert({
      name,
      models: JSON.stringify(models),
      created_at: new Date(),
    }).returning("id");

    res.status(201).json({ group: { id, name, models } });
  } catch (error) {
    logger.error("❌ Failed to create AI group:", error);
    res.status(500).json({ error: "Failed to create AI group" });
  }
};

export const deleteAIGroup = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await db("ai_groups").where({ id }).del();

    if (deleted) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: "Group not found" });
    }
  } catch (error) {
    logger.error("❌ Failed to delete AI group:", error);
    res.status(500).json({ error: "Failed to delete AI group" });
  }
};

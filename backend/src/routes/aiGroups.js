// ✅ FILE: /backend/src/routes/aiGroups.js

import express from "express";
import {
  getAIGroups,
  createAIGroup,
  deleteAIGroup,
} from "../controllers/aiGroupsController.js";

const router = express.Router();

router.get("/", getAIGroups);
router.post("/", createAIGroup);
router.delete("/:id", deleteAIGroup);

export default router;

import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  message: String,
  level: String,
  timestamp: Date,
});

const Log = mongoose.model("Log", logSchema);

export default Log; // ✅ Corrected for ES module

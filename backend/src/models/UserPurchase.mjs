// ✅ FILE PATH: backend/src/models/UserPurchase.js

import mongoose from "mongoose";

const UserPurchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    apiId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceAPI", required: true },
});

module.exports = mongoose.model("UserPurchase", UserPurchaseSchema);

// ✅ FILE PATH: backend/src/models/MarketplaceAPI.js

const mongoose = require("mongoose");

const MarketplaceAPISchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    apiEndpoint: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviews: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            rating: { type: Number, min: 1, max: 5 },
            review: { type: String },
        },
    ],
    avgRating: { type: Number, default: 0 },
});

module.exports = mongoose.model("MarketplaceAPI", MarketplaceAPISchema);

// ✅ FILE PATH: backend/src/controllers/serviceController.js

const Service = require("../models/Service"); // New DB model for services
const UserService = require("../models/UserService"); // Track user-added services

// ✅ Add AI/Storage Service & Register Globally
const addUserService = async (req, res) => {
    const { type, platform, authMethod, apiKey, username, password, storageCapacity } = req.body;

    try {
        let service = await Service.findOne({ platform });

        // ✅ If service does not exist globally, register it
        if (!service) {
            service = new Service({
                platform,
                type,
                authOptions: authMethod === "api" ? ["API Key"] : ["Username & Password"],
            });
            await service.save();
        }

        // ✅ Store user-specific instance of the service
        const userService = new UserService({
            userId: req.user.id,
            platform,
            authMethod,
            apiKey,
            username,
            password,
            storageCapacity: parseInt(storageCapacity, 10),
        });

        await userService.save();
        res.status(201).json({ message: `Service '${platform}' added successfully!`, service });
    } catch (error) {
        console.error("❌ Error adding service:", error);
        res.status(500).json({ message: "Error adding service. Please try again." });
    }
};

// ✅ Fetch All AI/Storage Services (Global List)
const getAvailableServices = async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        console.error("❌ Error fetching services:", error);
        res.status(500).json({ message: "Error fetching available services." });
    }
};

module.exports = { addUserService, getAvailableServices };

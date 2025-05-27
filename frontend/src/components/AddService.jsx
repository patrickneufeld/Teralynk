// ✅ FILE PATH: frontend/src/components/AddService.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";

const AddService = () => {
    const [serviceType, setServiceType] = useState("ai");
    const [platform, setPlatform] = useState("");
    const [availableServices, setAvailableServices] = useState([]);
    const [authMethod, setAuthMethod] = useState("api");
    const [apiKey, setApiKey] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [storageCapacity, setStorageCapacity] = useState(0);
    const [userStorage, setUserStorage] = useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch available services
        const fetchServices = async () => {
            try {
                const response = await axios.get("/api/services/available-services");
                setAvailableServices(response.data);
            } catch (error) {
                console.error("Error fetching available services:", error);
            }
        };
        fetchServices();

        // Fetch user storage
        const fetchUserStorage = async () => {
            try {
                const response = await axios.get("/api/user/storage");
                setUserStorage(response.data.totalStorage);
            } catch (error) {
                console.error("Error fetching storage data:", error);
            }
        };
        fetchUserStorage();
    }, []);

    const handleAddService = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (!platform || (authMethod === "api" && !apiKey) || (authMethod === "login" && (!username || !password))) {
            setError("All required fields must be filled.");
            setLoading(false);
            return;
        }

        const requestData = {
            type: serviceType,
            platform,
            authMethod,
            apiKey: authMethod === "api" ? apiKey : undefined,
            username: authMethod === "login" ? username : undefined,
            password: authMethod === "login" ? password : undefined,
            storageCapacity: parseInt(storageCapacity, 10),
        };

        try {
            const response = await axios.post("/api/services/add-service", requestData);
            setSuccess(`Service '${platform}' added successfully!`);
            setUserStorage(userStorage + parseInt(storageCapacity, 10));
            setAvailableServices([...availableServices, { platform, type: serviceType }]);
        } catch (err) {
            setError(err.response?.data?.message || "Error adding service. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white shadow-lg rounded-lg max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Add AI/Storage Service</h2>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-2">{success}</p>}

            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="block w-full p-2">
                <option value="">Select a service...</option>
                {availableServices.map((s) => (
                    <option key={s.platform} value={s.platform}>
                        {s.platform} ({s.type})
                    </option>
                ))}
                <option value="new">Add New</option>
            </select>

            <button className="w-full bg-blue-500 text-white p-2 mt-4" onClick={handleAddService}>
                {loading ? "Adding..." : "Add Service"}
            </button>
        </div>
    );
};

export default AddService;

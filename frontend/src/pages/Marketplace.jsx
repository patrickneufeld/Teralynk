// ✅ FILE PATH: frontend/src/pages/Marketplace.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const Marketplace = () => {
    const [apis, setApis] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAPIs = async () => {
            try {
                const response = await axios.get("/api/marketplace/list");
                setApis(response.data);
            } catch (err) {
                setError("Error loading APIs.");
            }
        };
        fetchAPIs();
    }, []);

    const handlePurchase = async (apiId) => {
        try {
            await axios.post(`/api/marketplace/purchase/${apiId}`);
            alert("API purchased successfully!");
        } catch (err) {
            setError("Error purchasing API.");
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">API Marketplace</h2>
            {error && <Alert className="mb-4 text-red-500">{error}</Alert>}

            <div className="grid gap-4">
                {apis.map((api) => (
                    <Card key={api._id}>
                        <CardContent className="p-4">
                            <h3 className="text-lg font-bold">{api.name}</h3>
                            <p className="text-gray-600">{api.description}</p>
                            <p className="font-semibold">Price: ${api.price}</p>
                            <Button onClick={() => handlePurchase(api._id)} className="mt-2 bg-blue-500 text-white">
                                Purchase API
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Marketplace;

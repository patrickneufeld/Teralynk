// /Users/patrick/Projects/Teralynk/frontend/src/components/AITools.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";

const AITools = () => {
    const [tools, setTools] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAITools = async () => {
            try {
                const response = await axios.get("/api/ai-tools");
                setTools(response.data);
            } catch (err) {
                setError("Failed to load AI tools.");
            } finally {
                setLoading(false);
            }
        };

        fetchAITools();
    }, []);

    const handleToolUse = (tool) => {
        alert(`Using ${tool.name}!`);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">AI Tools</h2>

            {loading && <Loader className="mb-4" />}
            {error && <Alert className="mb-4 text-red-500">{error}</Alert>}

            {!loading && !error && tools.length === 0 && (
                <p className="text-center text-gray-600">No AI tools available at the moment.</p>
            )}

            <div className="grid gap-4">
                {tools.map((tool) => (
                    <Card key={tool.id} className="p-4 bg-gray-100">
                        <CardContent>
                            <h3 className="text-lg font-semibold">{tool.name}</h3>
                            <p className="text-sm text-gray-600">{tool.description}</p>
                            <Button
                                onClick={() => handleToolUse(tool)}
                                aria-label={`Use ${tool.name}`}
                                className="mt-3 bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Use {tool.name}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AITools;
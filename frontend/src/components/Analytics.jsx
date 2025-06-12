// /Users/patrick/Projects/Teralynk/frontend/src/components/Analytics.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { Loader } from "../components/ui/loader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Analytics = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get("/api/analytics");
            setAnalyticsData(response.data);
        } catch (err) {
            setError("Failed to fetch analytics data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader className="mt-6" />;
    }

    if (error) {
        return (
            <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg text-center">
                <Alert className="mb-4 text-red-500">{error}</Alert>
                <Button onClick={fetchAnalytics} className="bg-blue-500 hover:bg-blue-600 text-white">
                    Retry
                </Button>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg text-center">
                <p className="text-gray-600">No analytics data available at the moment.</p>
            </div>
        );
    }

    const analyticsChartData = [
        { name: "Files Uploaded", value: analyticsData.filesUploaded ?? 0 },
        { name: "Collaborations", value: analyticsData.collaborations ?? 0 },
        { name: "AI Tool Usage", value: analyticsData.aiUsage ?? 0 },
        { name: "Storage Used (MB)", value: (analyticsData.storageUsed / (1024 * 1024)).toFixed(2) },
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Analytics & Insights</h2>

            <Card className="mb-4">
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">User Activity</h3>
                    <p>Files Uploaded: {analyticsData.filesUploaded ?? 0}</p>
                    <p>Collaborations: {analyticsData.collaborations ?? 0}</p>
                    <p>AI Tool Usage: {analyticsData.aiUsage ?? 0}</p>
                </CardContent>
            </Card>

            <Card className="mb-4">
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">Storage Usage</h3>
                    <p>Total Storage Used: {(analyticsData.storageUsed / (1024 * 1024)).toFixed(2)} MB</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Analytics Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsChartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#4F46E5" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default Analytics;

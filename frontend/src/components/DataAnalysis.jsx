// /Users/patrick/Projects/Teralynk/frontend/src/components/DataAnalysis.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent } from "../components/ui/Card";
import '../styles/components/DataAnalysis.css';

const DataAnalysis = () => {
    const [analysisData, setAnalysisData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const response = await axios.get('/api/data-analysis');
                setAnalysisData(response.data);
            } catch (err) {
                setError('Failed to load data analysis.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, []);

    const chartData = {
        labels: analysisData.labels || [],
        datasets: [
            {
                label: 'Analysis Metrics',
                data: analysisData.values || [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="data-analysis">
            <h2>Data Analysis</h2>
            {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
                <Card>
                    <CardContent>
                        <Bar data={chartData} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DataAnalysis;

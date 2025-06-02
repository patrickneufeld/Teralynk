// /Users/patrick/Projects/Teralynk/frontend/src/components/AIModelTraining.jsx

import React, { useState } from 'react';
import axios from 'axios';
import '../styles/components/AIModelTraining.css';

const AIModelTraining = () => {
    const [trainingStatus, setTrainingStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrainModel = async () => {
        setLoading(true);
        setError('');
        setTrainingStatus('Training in progress...');

        try {
            const response = await axios.post('/api/ai/train-model');
            setTrainingStatus(response.data.message || 'Training completed successfully!');
        } catch (err) {
            setError('Failed to start training.');
            setTrainingStatus('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-model-training">
            <h2>AI Model Training</h2>
            {error && <p className="error-message">{error}</p>}
            <button onClick={handleTrainModel} disabled={loading}>
                {loading ? 'Training...' : 'Train Model'}
            </button>
            {trainingStatus && <p className="status-message">{trainingStatus}</p>}
        </div>
    );
};

export default AIModelTraining;

// File Path: frontend/components/Onboarding.jsx

import React, { useState } from 'react';
import '../styles/Onboarding.css'; // Updated path to align with styles directory

const steps = [
    {
        title: "Welcome to Teralynk",
        content: "Discover how Teralynk can help you manage files, collaborate, and explore AI tools.",
    },
    {
        title: "File Management",
        content: "Upload and organize your files seamlessly across devices.",
    },
    {
        title: "Collaboration",
        content: "Invite your team and start collaborating in real-time.",
    },
    {
        title: "AI Tools",
        content: "Explore AI integrations to boost productivity.",
    },
];

const Onboarding = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else if (onComplete) {
            onComplete();
        }
    };

    return (
        <div className="onboarding">
            <div className="onboarding-content">
                <h2>{steps[currentStep].title}</h2>
                <p>{steps[currentStep].content}</p>
            </div>
            <div className="onboarding-actions">
                <button onClick={handleNext} aria-label="Next step">
                    {currentStep < steps.length - 1 ? "Next" : "Finish"}
                </button>
                <progress
                    value={currentStep + 1}
                    max={steps.length}
                    className="onboarding-progress"
                    aria-label="Onboarding Progress"
                />
            </div>
        </div>
    );
};

export default Onboarding;

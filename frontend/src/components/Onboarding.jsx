// /Users/patrick/Projects/Teralynk/frontend/src/components/Onboarding.jsx

import React, { useState } from "react";
import { Card, CardContent } from "..components/ui/Card";
import Button from "../components/ui/Button";
import "../styles/components/Onboarding.css";

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
        content: "Explore AI integrations to boost productivity and streamline workflows.",
    },
];

export default function Onboarding({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prevStep) => prevStep + 1);
        } else if (onComplete) {
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep((prevStep) => prevStep - 1);
        }
    };

    return (
        <div className="onboarding p-6 flex flex-col items-center">
            <Card className="max-w-lg w-full shadow-lg">
                <CardContent className="p-6 text-center">
                    <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
                    <p className="text-gray-600 mb-4">{steps[currentStep].content}</p>
                    <div className="flex justify-between items-center mt-4">
                        {currentStep > 0 && (
                            <Button
                                onClick={handlePrevious}
                                className="bg-gray-400 hover:bg-gray-500 text-white"
                                aria-label="Previous step"
                            >
                                Previous
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            className="bg-blue-500 hover:bg-blue-600 text-white ml-auto"
                            aria-label={currentStep < steps.length - 1 ? "Next step" : "Complete onboarding"}
                        >
                            {currentStep < steps.length - 1 ? "Next" : "Finish"}
                        </Button>
                    </div>
                    <progress
                        value={currentStep + 1}
                        max={steps.length}
                        className="onboarding-progress mt-4 w-full"
                        aria-label="Onboarding Progress"
                    />
                </CardContent>
            </Card>
        </div>
    );
}

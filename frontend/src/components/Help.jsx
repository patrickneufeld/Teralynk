// /Users/patrick/Projects/Teralynk/frontend/src/components/Help.jsx

import React from "react";
import { Card, CardContent } from "..components/ui/Card";
import { FaQuestionCircle } from "react-icons/fa";

const Help = () => {
    const faqs = [
        {
            question: "How do I upload files?",
            answer: "Go to the Dashboard and click the 'Upload New File' button."
        },
        {
            question: "How do I invite team members?",
            answer: "Navigate to the Team Management section in Settings and add their email."
        },
        {
            question: "What are AI Tools?",
            answer: "AI Tools help automate tasks such as file organization, search, and collaboration."
        }
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Help & FAQs</h2>

            <div className="grid gap-4">
                {faqs.map((faq, index) => (
                    <Card key={index} className="bg-gray-100">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <FaQuestionCircle size={18} className="text-blue-500" />
                                <h3 className="text-lg font-semibold">{faq.question}</h3>
                            </div>
                            <p className="text-gray-700 mt-2">{faq.answer}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <p className="text-center mt-6 text-gray-700">
                For further assistance, contact our support team at{" "}
                <a
                    href="mailto:support@teralynk.com"
                    aria-label="Email support"
                    className="text-blue-500 hover:underline"
                >
                    support@teralynk.com
                </a>.
            </p>
        </div>
    );
};

export default Help;

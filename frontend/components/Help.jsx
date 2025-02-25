// File Path: frontend/components/Help.jsx

import React from 'react';
import '../styles/Help.css';

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
        <div className="help">
            <h2>Help & FAQs</h2>
            <div className="faq-section">
                {faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                        <h3 className="faq-question">{faq.question}</h3>
                        <p className="faq-answer">{faq.answer}</p>
                    </div>
                ))}
            </div>
            <p className="support-contact">
                For further assistance, contact our support team at{" "}
                <a href="mailto:support@teralynk.com" aria-label="Email support">
                    support@teralynk.com
                </a>.
            </p>
        </div>
    );
};

export default Help;

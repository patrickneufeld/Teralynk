// ✅ FILE PATH: frontend/src/components/About.jsx

import React from 'react';
import '../styles/components/About.css';

const About = () => {
    return (
        <div className="about">
            <h1>About Teralynk</h1>
            <p>
                Welcome to <strong>Teralynk</strong>, the ultimate platform for seamless AI-powered collaboration, 
                storage, and workflow automation. Our goal is to revolutionize the way users interact with files 
                by integrating multiple AI platforms into a unified, intuitive experience.
            </p>

            <section className="about-section">
                <h2>Our Vision</h2>
                <p>
                    Teralynk is built to empower individuals and businesses by enhancing productivity, 
                    security, and AI-driven intelligence for file management. Our vision includes:
                </p>
                <ul>
                    <li>Seamless AI integration across multiple platforms.</li>
                    <li>Smart, automated file organization and retrieval.</li>
                    <li>Collaboration tools that make teamwork more efficient.</li>
                    <li>Advanced security measures to protect user data.</li>
                </ul>
            </section>

            <section className="about-section">
                <h2>Key Features</h2>
                <ul>
                    <li><strong>AI-Powered Search:</strong> Quickly find files using AI-driven suggestions.</li>
                    <li><strong>Multi-Platform Integration:</strong> Connect with Google Drive, Dropbox, and more.</li>
                    <li><strong>Automated Workflows:</strong> Optimize repetitive tasks with intelligent automation.</li>
                    <li><strong>Secure Storage:</strong> End-to-end encryption ensures your data remains private.</li>
                    <li><strong>Collaboration Tools:</strong> Share, edit, and discuss files in real-time.</li>
                </ul>
            </section>

            <section className="about-section">
                <h2>Why Choose Teralynk?</h2>
                <p>
                    Unlike traditional storage solutions, Teralynk leverages AI to make file management intuitive 
                    and automated. Whether you’re an individual, a startup, or a large enterprise, our platform 
                    adapts to your needs.
                </p>
            </section>
        </div>
    );
};

export default About;

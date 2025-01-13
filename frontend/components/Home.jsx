// File Path: frontend/components/Home.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; // Updated path to match the styles directory

const Home = () => {
    return (
        <div className="home-container">
            <header className="home-header">
                <h1>Welcome to Teralynk</h1>
                <p>
                    The ultimate platform for unified file storage, advanced AI integration, and real-time collaboration. 
                    Teralynk empowers you to seamlessly store, manage, and share files while leveraging cutting-edge AI tools for enhanced productivity.
                </p>
                <Link to="/signup" className="cta-btn" aria-label="Get started with Teralynk">
                    Get Started
                </Link>
            </header>
            <section className="home-features">
                {features.map((feature, index) => (
                    <div key={index} className="feature">
                        <h2>{feature.title}</h2>
                        <p>{feature.description}</p>
                    </div>
                ))}
            </section>
        </div>
    );
};

// Features data for better maintainability
const features = [
    {
        title: 'AI-Enhanced File Management',
        description:
            'Automatically organize, search, and categorize files with intelligent AI algorithms that save you time and effort.',
    },
    {
        title: 'Real-Time Collaboration',
        description:
            'Collaborate with your team or clients in real-time. Share files, add comments, and track changes instantly from any device.',
    },
    {
        title: 'Secure File Sharing',
        description:
            'Share files securely with customizable permissions and end-to-end encryption, ensuring your data is always protected.',
    },
    {
        title: 'Cross-Platform Sync',
        description:
            'Access your files and projects from any device—desktop, mobile, or web—without missing a beat.',
    },
    {
        title: 'Integrated AI Tools',
        description:
            'Build and manage AI workflows directly within Teralynk. Save your credentials, and let the platform handle the rest.',
    },
    {
        title: 'Customizable Workspaces',
        description:
            'Create tailored workspaces for different teams or projects, ensuring everyone has the tools and data they need.',
    },
];

export default Home;

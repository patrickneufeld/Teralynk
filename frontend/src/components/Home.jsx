import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/Home.css'; // Ensure the correct path to the CSS file

function Home() {
    return (
        <div className="home-container">
            <section className="hero">
                <h1>Welcome to <span className="brand">Teralynk</span></h1>
                <p>
                    Your unified file storage solution powered by AI integrations. 
                    Access, manage, and secure your files from anywhere, anytime.
                </p>
                <div className="cta-buttons">
                    <Link to="/signup" className="cta-signup">Get Started</Link>
                    <Link to="/about" className="cta-learn-more">Learn More</Link>
                </div>
            </section>

            <section className="key-features">
                <h2>Key Features</h2>
                <ul>
                    <li>✅ Seamless integration with major cloud storage providers</li>
                    <li>🔍 AI-powered file organization and search</li>
                    <li>🔐 Secure sharing and collaboration tools</li>
                    <li>📁 Customizable storage tiers for individuals and businesses</li>
                </ul>
            </section>

            <section className="testimonials">
                <h2>What Our Users Say</h2>
                <p>🚀 "Teralynk has revolutionized the way we manage and organize files!" - TechWorld</p>
                <p>🔒 "A secure and AI-driven approach to cloud storage. Highly recommended!" - CloudReview</p>
            </section>

            <footer className="home-footer">
                <p>&copy; {new Date().getFullYear()} Teralynk. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Home;

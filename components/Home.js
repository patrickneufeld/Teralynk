import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home">
            <h1>Welcome to Teralynk</h1>
            <p>Your unified file storage platform with AI integrations.</p>
            <Link to="/signup" className="cta-btn">Get Started</Link>
        </div>
    );
};

export default Home;

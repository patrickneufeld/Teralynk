// ================================================
// ✅ FILE: /frontend/src/components/About.jsx
// Modern About Page — Vision, Features, MCP, Store
// ================================================

import React, { useEffect } from 'react';
import '../styles/components/About.css';

const About = () => {
  useEffect(() => {
    document.title = "About | Teralynk";
  }, []);

  return (
    <main className="about-container">
      {/* 🔹 Intro Section */}
      <section className="about-hero">
        <h1 className="section-title">About Teralynk</h1>
        <p className="lead">
          Teralynk is a next-generation AI platform designed for seamless collaboration, intelligent storage,
          and scalable automation. We unify your digital world with one secure, intelligent, and extensible system.
        </p>
      </section>

      {/* 🔹 Vision Section */}
      <section className="about-section">
        <h2>Our Vision</h2>
        <p>
          We envision a world where digital workflows are effortless, secure, and powered by intelligent automation.
          Teralynk is built for creators, teams, and enterprises who demand more from their digital infrastructure.
        </p>
        <ul>
          <li>⚡ Unified AI integrations with Nova Pro, Bedrock, and Open Source LLMs</li>
          <li>📁 Smart file organization, AI tagging, and intelligent retrieval</li>
          <li>🔒 Enterprise-grade encryption, access control, and audit logging</li>
          <li>👥 Real-time collaboration and secure multi-user editing</li>
        </ul>
      </section>

      {/* 🔹 Features Section */}
      <section className="about-section features-highlight">
        <h2>Key Features</h2>
        <ul>
          <li><strong>AI-Powered Search:</strong> Surface relevant content instantly with contextual intelligence.</li>
          <li><strong>MCP Runtime:</strong> Launch, manage, and integrate third-party apps like Minecraft, Notion, AWS CLI and more with our Modular Command Protocol.</li>
          <li><strong>Dynamic API Store:</strong> Sell and deploy new AI modules or automations directly from your dashboard using our built-in API marketplace.</li>
          <li><strong>Workflow Automation:</strong> Streamline repetitive tasks with drag-and-drop logic and AI decisioning.</li>
          <li><strong>Cross-Cloud Compatibility:</strong> Connect to S3, Dropbox, Google Drive, and custom buckets.</li>
          <li><strong>Secure Storage:</strong> End-to-end encryption with isolated key management and real-time access logs.</li>
        </ul>
      </section>

      {/* 🔹 Differentiation */}
      <section className="about-section why-teralynk">
        <h2>Why Choose Teralynk?</h2>
        <p>
          Unlike legacy storage platforms, Teralynk is built to evolve. Whether you're a solo developer,
          global enterprise, or startup, our infrastructure flexes to your needs — all while delivering blazing performance, zero-trust security, and intelligent automation.
        </p>
        <p>
          From launching MCP apps to monetizing your own API-powered workflows, Teralynk isn’t just a platform — it's your AI operating system for the future of digital work.
        </p>
      </section>

      {/* 🔹 Footer Tagline */}
      <footer className="about-footer">
        <p>&copy; {new Date().getFullYear()} Teralynk — Designed for Purpose, Powered by Innovation.</p>
      </footer>
    </main>
  );
};

export default About;

// ================================================
// ✅ FILE: /frontend/src/components/Home.jsx
// Modern Home Page for Teralynk
// ================================================

import React, { useEffect } from "react";
import { Link } from "react-router-dom";

try {
  import("../styles/components/Home.css");
} catch (e) {
  console.warn("⚠️ Home.css not found.");
}

const Home = () => {
  useEffect(() => {
    document.title = "Teralynk | AI Storage Platform";
  }, []);

  return (
    <main className="home-container">
      {/* 🌟 HERO SECTION */}
      <section className="hero modern-hero">
        <div className="logo-box">
          <img
            src="/assets/TeralynkLogoTransparent.png"
            alt="Teralynk Logo"
            className="logo-img"
            width="150"
            height="150"
          />
        </div>
        <h1 className="hero-title">Seamless AI-Driven File Management</h1>
        <p className="hero-subtitle">
          Empowering you to store, organize, and access your files — smarter and safer.
        </p>
        <div className="hero-cta">
          <Link to="/signup" className="btn btn-primary">Get Started</Link>
          <Link to="/about" className="btn btn-outline">Learn More</Link>
        </div>
      </section>

      {/* 💡 FEATURES SECTION */}
      <section className="features-section">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>🔗 Unified Cloud Access</h3>
            <p>Connect to Dropbox, Google Drive, S3, and more — all in one place.</p>
          </div>
          <div className="feature-card">
            <h3>🧠 AI Organization</h3>
            <p>Intelligent categorization, version control, and smart search at your fingertips.</p>
          </div>
          <div className="feature-card">
            <h3>🔐 Zero Trust Security</h3>
            <p>Encrypted storage and activity monitoring with full auditability.</p>
          </div>
          <div className="feature-card">
            <h3>⚡ Blazing Performance</h3>
            <p>Optimized storage routing ensures fast access anywhere in the world.</p>
          </div>
        </div>
      </section>

      {/* 🙌 TESTIMONIALS SECTION */}
      <section className="testimonials-section">
        <h2 className="section-title">Trusted by Teams Worldwide</h2>
        <div className="testimonial-cards">
          <div className="testimonial">
            <blockquote>
              “Teralynk changed how our engineering team shares and secures code.”
            </blockquote>
            <p className="author">— DevSphere Labs</p>
          </div>
          <div className="testimonial">
            <blockquote>
              “A polished, powerful platform that scales with our growth. Game changer.”
            </blockquote>
            <p className="author">— StratCloud.io</p>
          </div>
        </div>
      </section>

      {/* 📄 FOOTER */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Teralynk — Powered by Purpose • John 3:16</p>
      </footer>
    </main>
  );
};

export default Home;

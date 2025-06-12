// File: /frontend/src/pages/John316.jsx

import React from 'react';

const John316 = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col items-center justify-center px-6 py-12">
      {/* Teralynk Identity */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-4">
        John 3:16
      </h1>

      {/* Scripture */}
      <p className="text-xl md:text-2xl font-medium text-center max-w-3xl mb-8">
        “For God so loved the world that He gave His one and only Son,
        that whoever believes in Him shall not perish but have eternal life.”
        <br />
        <span className="block mt-2 text-base text-gray-600">(John 3:16, NIV)</span>
      </p>

      {/* Explanation */}
      <div className="max-w-2xl text-center text-lg space-y-4 text-gray-700">
        <p>
          At Teralynk, this verse reflects the heart behind our work — a commitment to creating
          with love, collaborating with purpose, and serving others with excellence.
        </p>
        <p>
          We believe technology should empower, not isolate. Whether you're building your vision,
          organizing your life, or partnering across the globe — our prayer is that you feel seen,
          supported, and valued.
        </p>
        <p>
          This page isn’t about religion. It’s about meaning. Legacy. And hope.
        </p>
        <p className="font-semibold text-gray-800">
          🌍 You matter. Your work matters. Your life has eternal value.
        </p>
      </div>

      {/* Optional footer or nav link */}
      <div className="mt-12 text-sm text-gray-500">
        <a href="/" className="underline hover:text-gray-700">
          ← Back to Teralynk Home
        </a>
      </div>
    </div>
  );
};

export default John316;

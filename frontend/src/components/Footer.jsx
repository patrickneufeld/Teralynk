// ✅ FILE: /frontend/src/components/Footer.jsx

import React from "react";
import "../styles/components/Footer.css"; // Make sure this path exists

const Footer = () => {
  return (
    <footer
      className="footer w-full py-4 px-6 mt-auto bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400"
      role="contentinfo"
      aria-label="Teralynk Footer"
    >
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <p className="text-center sm:text-left">
          &copy; {new Date().getFullYear()} <strong className="text-gray-800 dark:text-white">Teralynk</strong>. All rights reserved.
        </p>

        {/* Optional: Add footer links or social icons here */}
        {/* <div className="flex gap-4 mt-2 sm:mt-0">
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms</a>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;

// ✅ FILE: /frontend/src/components/Help.jsx

import React from "react";
import { Card, CardContent } from "../components/ui/Card"; // ✅ FIXED PATH
import { FaQuestionCircle } from "react-icons/fa";
import "../styles/components/Help.css"; // Optional: your CSS file if it exists

const Help = () => {
  return (
    <div className="p-6 flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="max-w-3xl w-full">
        <CardContent>
          <div className="text-center">
            <FaQuestionCircle className="text-blue-600 text-5xl mb-4" />
            <h1 className="text-3xl font-bold mb-2">Need Help?</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We're here to assist you with getting the most out of Teralynk.
            </p>

            <ul className="text-left text-gray-700 dark:text-gray-200 space-y-2">
              <li>• Learn how to upload, manage, and share files</li>
              <li>• Set up and use AI tools like Workbench and Analytics</li>
              <li>• Understand team collaboration features</li>
              <li>• Manage your profile and storage settings</li>
              <li>• Contact support for personalized help</li>
            </ul>

            <div className="mt-6">
              <a
                href="mailto:support@teralynk.com"
                className="text-blue-600 hover:underline"
              >
                📧 Contact Support
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;

// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/FeedbackForm.jsx

import React, { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import Alert from "./Alert";
import { logError, getErrorMessage } from "../../utils/ErrorHandler";

const FeedbackForm = ({ onSubmit, onCancel, contextLabel = "this item" }) => {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState(null); // "success" | "error"

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setStatus("error");
      return;
    }

    try {
      await onSubmit(feedback);
      setStatus("success");
      setFeedback("");
    } catch (err) {
      logError(err, "FeedbackForm - onSubmit");
      setStatus("error");
    }
  };

  return (
    <div className="feedback-form-container mt-4 p-4 border rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Give Feedback on {contextLabel}</h3>
      <textarea
        className="w-full p-2 border rounded mb-2"
        rows={4}
        placeholder="Write your feedback..."
        value={feedback}
        onChange={(e) => {
          setStatus(null);
          setFeedback(e.target.value);
        }}
      />
      <div className="flex gap-2">
        <Button className="bg-blue-500 text-white" onClick={handleSubmit}>
          Submit
        </Button>
        <Button className="bg-gray-400 text-white" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {status === "success" && (
        <Alert type="success" className="mt-2">
          ✅ Feedback submitted!
        </Alert>
      )}
      {status === "error" && (
        <Alert type="error" className="mt-2">
          ⚠️ Please write valid feedback before submitting.
        </Alert>
      )}
    </div>
  );
};

export default FeedbackForm;

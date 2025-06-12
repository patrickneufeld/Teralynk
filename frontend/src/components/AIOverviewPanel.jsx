// ✅ FILE: /frontend/src/components/AIOverviewPanel.jsx

import React from "react";
import PropTypes from "prop-types";
import { useAuth } from "@/contexts";
import { logEvent } from "@/utils/logging/logging";
import { hasPermission } from "@/utils/authUtils";
import { useToast } from "@/hooks/useToast";
import { ErrorBoundary } from "@/utils/logging/ErrorBoundary";
import { Tooltip } from "@/components/ui/Tooltip";

function AIOverviewPanel({ insights = [], traceId = null, requiredPermission = null }) {
  const { user, permissions } = useAuth();
  const { showToast } = useToast();

  const accessible = !requiredPermission || hasPermission(permissions, requiredPermission);
  if (!accessible || insights.length === 0) return null;

  const handleClick = (insight) => {
    logEvent("ai_overview_clicked", {
      userId: user?.id,
      insightType: insight?.type,
      traceId,
      timestamp: new Date().toISOString(),
    });

    showToast({
      title: `AI Insight: ${insight?.type}`,
      description: insight?.message || "No detailed message provided.",
      variant: "info",
    });
  };

  return (
    <ErrorBoundary>
      <section
        className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg shadow-sm"
        aria-label="AI Overview Panel"
        role="region"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🧠 AI Overview
        </h2>
        <ul className="space-y-3">
          {insights.map((insight, idx) => (
            <li
              key={idx}
              tabIndex={0}
              role="listitem"
              onClick={() => handleClick(insight)}
              onKeyDown={(e) => e.key === "Enter" && handleClick(insight)}
              className="p-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer rounded-md"
              aria-label={`Insight: ${insight?.type || "Insight"}`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {insight?.type || "Insight"}
                </h3>
                {insight?.confidence != null && (
                  <Tooltip content={`Confidence: ${insight.confidence}%`}>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {insight.confidence}%
                    </span>
                  </Tooltip>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {insight?.message || "No insight message available."}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </ErrorBoundary>
  );
}

AIOverviewPanel.propTypes = {
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      message: PropTypes.string,
      confidence: PropTypes.number,
    })
  ).isRequired,
  traceId: PropTypes.string,
  requiredPermission: PropTypes.string,
};

export default AIOverviewPanel;

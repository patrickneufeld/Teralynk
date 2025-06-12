// ✅ FILE: /frontend/src/components/AIInsights.jsx

import React from "react";
import PropTypes from "prop-types";
import { useAuth } from "@/contexts";
import { hasPermission } from "@/utils/authUtils";
import { logEvent } from "@/utils/logging/logging";
import { useToast } from "@/hooks/useToast";
import { ErrorBoundary } from "@/utils/logging/ErrorBoundary";
import { Tooltip } from "@/components/ui/Tooltip";

function AIInsights({ insights = [], traceId = null, maxItems = 3, requiredPermission = null }) {
  const { user, permissions } = useAuth();
  const { showToast } = useToast();

  const accessible = !requiredPermission || hasPermission(permissions, requiredPermission);

  if (!accessible || insights.length === 0) {
    return null;
  }

  const handleInsightClick = (insight) => {
    logEvent("ai_insight_clicked", {
      userId: user?.id,
      insightType: insight?.type,
      traceId,
      timestamp: new Date().toISOString(),
    });

    showToast({
      title: `AI Insight: ${insight?.type || "Insight"}`,
      description: insight?.message || "No insight message provided.",
      variant: "info",
    });
  };

  return (
    <ErrorBoundary>
      <div className="space-y-2" role="list" aria-label="AI Insights">
        {insights.slice(0, maxItems).map((insight, index) => (
          <div
            key={index}
            role="listitem"
            className="p-3 border rounded-md bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
            tabIndex={0}
            onClick={() => handleInsightClick(insight)}
            onKeyDown={(e) => e.key === "Enter" && handleInsightClick(insight)}
            aria-label={`Insight ${insight?.type || index + 1}`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {insight?.type || "Insight"}
              </h4>
              {insight?.confidence != null && (
                <Tooltip content={`Confidence: ${insight.confidence}%`}>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {insight.confidence}%
                  </span>
                </Tooltip>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {insight?.message || "No message provided by AI."}
            </p>
          </div>
        ))}
      </div>
    </ErrorBoundary>
  );
}

AIInsights.propTypes = {
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      message: PropTypes.string,
      confidence: PropTypes.number,
    })
  ),
  traceId: PropTypes.string,
  maxItems: PropTypes.number,
  requiredPermission: PropTypes.string,
};

export default AIInsights;

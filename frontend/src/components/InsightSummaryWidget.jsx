// ✅ FILE: /frontend/src/components/InsightSummaryWidget.jsx

import React from "react";
import PropTypes from "prop-types";
import { useAuth } from "@/contexts";
import { hasPermission } from "@/utils/authUtils";
import { logEvent } from "@/utils/logging/logging";
import { Tooltip } from "@/components/ui/Tooltip";
import { ErrorBoundary } from "@/utils/logging/ErrorBoundary";

function InsightSummaryWidget({ insights = [], traceId = null, requiredPermission = null, maxItems = 5 }) {
  const { user, permissions } = useAuth();

  const accessible = !requiredPermission || hasPermission(permissions, requiredPermission);
  if (!accessible || insights.length === 0) return null;

  const handleItemClick = (insight) => {
    logEvent("insight_summary_clicked", {
      userId: user?.id,
      insightType: insight?.type,
      traceId,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <ErrorBoundary>
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow p-4"
        role="region"
        aria-label="AI Insight Summary"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          🔍 Insight Summary
        </h3>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {insights.slice(0, maxItems).map((insight, index) => (
            <li
              key={index}
              tabIndex={0}
              role="listitem"
              onClick={() => handleItemClick(insight)}
              onKeyDown={(e) => e.key === "Enter" && handleItemClick(insight)}
              className="py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition cursor-pointer"
              aria-label={`Insight type: ${insight?.type || "Insight"}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                  {insight.type || "Insight"}
                </div>
                {insight?.confidence != null && (
                  <Tooltip content={`Confidence: ${insight.confidence}%`}>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {insight.confidence}%
                    </span>
                  </Tooltip>
                )}
              </div>
              {insight?.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {insight.summary}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </ErrorBoundary>
  );
}

InsightSummaryWidget.propTypes = {
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      summary: PropTypes.string,
      confidence: PropTypes.number,
    })
  ),
  traceId: PropTypes.string,
  requiredPermission: PropTypes.string,
  maxItems: PropTypes.number,
};

export default InsightSummaryWidget;

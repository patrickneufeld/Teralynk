// ✅ FILE: /frontend/src/components/ActivityFeed.jsx

import React from "react";
import PropTypes from "prop-types";
import { useAuth } from "@/contexts";
import { hasPermission } from "@/utils/authUtils";
import { logEvent } from "@/utils/logging/logging";
import { ErrorBoundary } from "@/utils/logging/ErrorBoundary";
import { Tooltip } from "@/components/ui/Tooltip";

function ActivityFeed({ activities = [], aiInsights = [], traceId = null, requiredPermission = null }) {
  const { user, permissions } = useAuth();

  const accessible = !requiredPermission || hasPermission(permissions, requiredPermission);

  if (!accessible || activities.length === 0) {
    return null;
  }

  const handleActivityClick = (activity) => {
    logEvent("activity_clicked", {
      userId: user?.id,
      activityId: activity?.id,
      traceId,
      timestamp: new Date().toISOString(),
    });
  };

  const findInsightForActivity = (activityId) =>
    aiInsights.find((i) => i.activityId === activityId || i.relatedId === activityId);

  return (
    <ErrorBoundary>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700" role="list" aria-label="User Activity Feed">
        {activities.map((activity, index) => {
          const aiInsight = activity.aiInsight || findInsightForActivity(activity.id);
          const suggestion = activity.filenameSuggestion || aiInsight?.suggestedFilename;

          return (
            <li
              key={activity.id || index}
              className="py-4 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 rounded-md transition cursor-pointer"
              role="listitem"
              tabIndex={0}
              onClick={() => handleActivityClick(activity)}
              onKeyDown={(e) => e.key === "Enter" && handleActivityClick(activity)}
              aria-label={`Activity: ${activity.action || "Unknown action"}`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  <strong className="font-medium">{activity.action || "Unknown Action"}</strong> on{" "}
                  <span className="text-gray-500 dark:text-gray-400">{activity.fileName || "Unnamed file"}</span>
                </div>
                {suggestion && (
                  <Tooltip content={`AI suggests: ${suggestion}`}>
                    <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 sm:mt-0">
                      📎 Rename Suggestion
                    </span>
                  </Tooltip>
                )}
              </div>
              {aiInsight?.message && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                  🤖 Insight: {aiInsight.message}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {new Date(activity.timestamp || Date.now()).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
    </ErrorBoundary>
  );
}

ActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      action: PropTypes.string,
      fileName: PropTypes.string,
      timestamp: PropTypes.string,
      aiInsight: PropTypes.object,
      filenameSuggestion: PropTypes.string,
    })
  ).isRequired,
  aiInsights: PropTypes.arrayOf(
    PropTypes.shape({
      activityId: PropTypes.string,
      message: PropTypes.string,
      suggestedFilename: PropTypes.string,
    })
  ),
  traceId: PropTypes.string,
  requiredPermission: PropTypes.string,
};

export default ActivityFeed;

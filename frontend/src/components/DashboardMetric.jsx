// ✅ FILE: /frontend/src/components/dashboard/DashboardMetric.jsx

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Tooltip } from "@/components/ui/Tooltip";
import { ErrorBoundary } from "@/utils/logging/ErrorBoundary";
import { useAuth } from "@/contexts";
import { useToast } from "@/hooks/useToast";
import { hasPermission } from "@/utils/authUtils";
import { logEvent, logError } from "@/utils/logging/logging";
import { v4 as uuidv4 } from "uuid";

/**
 * DashboardMetric is a hardened, memoized metric tile with AI insight handling, RBAC, telemetry, and traceability.
 * All metrics support click-safe telemetry logging and secure toast interaction.
 */
const DashboardMetric = React.memo(function DashboardMetric({
  title,
  value,
  trend = "neutral",
  icon = "📊",
  insights = null,
  requiredPermission = null,
  traceId = null,
}) {
  const { user, permissions } = useAuth();
  const { showToast } = useToast();

  // Hardened: traceable & unique per render
  const finalTraceId = useMemo(() => traceId || uuidv4(), [traceId]);

  // Enforce RBAC
  const accessible = !requiredPermission || hasPermission(permissions, requiredPermission);
  if (!accessible) return null;

  const trendClass = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-500 dark:text-red-400",
    neutral: "text-gray-600 dark:text-gray-300",
  }[trend] || "text-gray-600 dark:text-gray-300";

  const handleInsightClick = () => {
    try {
      if (!insights) return;

      showToast({
        title: `Insight: ${title}`,
        description: insights.length > 300 ? insights.slice(0, 297) + "..." : insights,
        variant: "info",
      });

      logEvent("metric_insight_viewed", {
        userId: user?.id,
        metric: title,
        traceId: finalTraceId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logError("Insight click handling failed", err);
    }
  };

  return (
    <ErrorBoundary traceId={finalTraceId}>
      <div
        className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-5 flex flex-col items-start min-h-[140px] transition duration-300 hover:shadow-lg focus:outline-none focus:ring"
        role="region"
        aria-labelledby={`metric-title-${title}`}
        data-testid={`dashboard-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}
        tabIndex={0}
      >
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl" role="img" aria-label={`${title} icon`}>{icon}</span>
          <h3
            id={`metric-title-${title}`}
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h3>
        </div>

        <div className={`text-2xl font-bold ${trendClass}`} data-testid="metric-value">
          {value}
        </div>

        {insights && (
          <Tooltip content={insights}>
            <button
              onClick={handleInsightClick}
              className="text-sm mt-2 text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
              aria-label={`View AI insight for ${title}`}
            >
              View AI Insight
            </button>
          </Tooltip>
        )}
      </div>
    </ErrorBoundary>
  );
});

DashboardMetric.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.oneOf(["up", "down", "neutral"]),
  icon: PropTypes.string,
  insights: PropTypes.string,
  requiredPermission: PropTypes.string,
  traceId: PropTypes.string,
};

export default DashboardMetric;

// ✅ FILE: /frontend/src/components/AIForecastTrendWidget.jsx

import React from "react";
import PropTypes from "prop-types";
import { Line } from "react-chartjs-2";
import { useAuth } from "@/contexts";
import { hasPermission } from "@/utils/authUtils";
import { ErrorBoundary } from "@/utils/logging/ErrorBoundary";
import { logEvent } from "@/utils/logging/logging";

function AIForecastTrendWidget({ data = {}, title = "AI Forecast Trend", traceId = null, requiredPermission = null }) {
  const { user, permissions } = useAuth();

  const accessible = !requiredPermission || hasPermission(permissions, requiredPermission);
  if (!accessible || !data?.labels || !data?.datasets) return null;

  const handleChartInteraction = () => {
    logEvent("ai_forecast_interacted", {
      userId: user?.id,
      traceId,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <ErrorBoundary>
      <section
        className="p-5 bg-white dark:bg-gray-900 rounded-lg shadow-sm"
        aria-label="AI Forecast Trend Widget"
        role="region"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📈 {title}
        </h2>
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            onClick: handleChartInteraction,
            plugins: {
              legend: { labels: { color: "#4B5563" } },
              tooltip: { mode: "index", intersect: false },
            },
            scales: {
              x: { ticks: { color: "#9CA3AF" } },
              y: { ticks: { color: "#9CA3AF" } },
            },
          }}
          height={240}
        />
      </section>
    </ErrorBoundary>
  );
}

AIForecastTrendWidget.propTypes = {
  data: PropTypes.shape({
    labels: PropTypes.array.isRequired,
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        data: PropTypes.array,
        backgroundColor: PropTypes.string,
        borderColor: PropTypes.string,
        fill: PropTypes.bool,
      })
    ),
  }).isRequired,
  title: PropTypes.string,
  traceId: PropTypes.string,
  requiredPermission: PropTypes.string,
};

export default AIForecastTrendWidget;

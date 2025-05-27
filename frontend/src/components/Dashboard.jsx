// ================================================
// ✅ FILE: /frontend/src/pages/Dashboard.jsx
// Hardened, enterprise-grade dashboard entry point
// ================================================

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSecrets } from "@/hooks/useSecrets";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";
import SecurityConsole from "@/components/SecurityConsole";
import ErrorBoundary from "@/components/ErrorBoundary";
import AIOverviewPanel from "@/components/AIOverviewPanel";
import InsightSummaryWidget from "@/components/InsightSummaryWidget";
import AIForecastTrendWidget from "@/components/AIForecastTrendWidget";
import ActivityFeed from "@/components/ActivityFeed";
import StorageLocationDetails from "@/components/StorageLocationDetails";
import { logError, logInfo } from "@/utils/logging/logging";
import { securityEvents, SECURITY_EVENTS } from "@/utils/security/eventEmitter";
import tokenManager from "@/utils/tokenManager";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

// Axios client
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5001",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      tokenManager.removeAllTokens();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

const initialSecurityStatus = {
  mfaEnabled: false,
  passwordStrength: "unknown",
  securityScore: 0,
  activeThreats: 0,
  riskLevel: "low",
};

const initialMetrics = {
  performance: {},
  storage: {},
  fileInsights: {},
  optimizations: [],
};

const initialUserContext = {
  user: null,
  usage: {},
  recentFiles: [],
};

const initialPlatformStats = {
  totalUsers: 0,
  totalFiles: 0,
  activeSessions: 0,
};

function Dashboard() {
  const navigate = useNavigate();
  const { user = {}, loggedIn } = useAuth();
  const { getSecrets } = useSecrets();

  const [data, setData] = useState(initialUserContext);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [securityStatus, setSecurityStatus] = useState(initialSecurityStatus);
  const [platformStats, setPlatformStats] = useState(initialPlatformStats);
  const [activities, setActivities] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiLearningFeedback, setAiLearningFeedback] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);

  const [wsMessage, setWsMessage] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const retryTimeout = useRef(null);
  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${tokenManager.getToken()}`,
    "X-Client-Version": import.meta.env.VITE_APP_VERSION,
    "X-Request-ID": crypto.randomUUID(),
    "X-User-ID": user?.id || "",
    "X-Session-ID": sessionStorage.getItem("sessionId") || "",
  }), [user?.id]);

  useEffect(() => {
    api.defaults.headers.common = {
      ...api.defaults.headers.common,
      ...authHeaders,
    };
  }, [authHeaders]);

  useEffect(() => {
    if (!user?.id) return;

    const setupWebSocket = async () => {
      try {
        const token = tokenManager.getToken();
        if (!token) throw new Error("Missing token for WebSocket");

        const wsUrl = `${import.meta.env.VITE_WS_URL || "ws://localhost:5001"}/ws/user-updates`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "auth", token }));
          logInfo("✅ WebSocket connection opened");
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            setWsMessage(msg);
          } catch (err) {
            logError("❌ WebSocket message parse error", err);
          }
        };

        ws.onerror = (err) => {
          logError("❌ WebSocket error", err);
        };

        ws.onclose = () => {
          logInfo("🛑 WebSocket closed");
        };

        setWsConnection(ws);
      } catch (err) {
        logError("⚠️ WebSocket setup failed", err);
        retryTimeout.current = setTimeout(setupWebSocket, 5000);
      }
    };

    setupWebSocket();

    return () => {
      wsConnection?.close?.();
      clearTimeout(retryTimeout.current);
    };
  }, [user?.id]);

  const fetchDashboardData = useCallback(async () => {
    if (!loggedIn || !user?.id) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const safeApiCall = async (promise, fallback = {}) => {
        try {
          const res = await promise;
          return res?.data ?? fallback;
        } catch (err) {
          logError("API call failed", err);
          return fallback;
        }
      };

      const [
        perfStats,
        perfLogs,
        userData,
        storageUsageData,
        storageCostData,
        storageLocationsData,
        recommendationsData,
        insightsData,
        securityData,
        filenameSuggestions,
        metricsData,
        activitiesData,
        platformSummaryData
      ] = await Promise.all([
        safeApiCall(api.get("/api/performance/stats"), {}),
        safeApiCall(api.get("/api/performance/logs"), []),
        safeApiCall(api.get("/api/user-data"), {}),
        safeApiCall(api.get("/api/storage/usage"), {}),
        safeApiCall(api.get("/api/storage/cost-analysis"), {}),
        safeApiCall(api.get("/api/storage/locations"), []),
        safeApiCall(api.get("/api/storage/recommendations"), []),
        safeApiCall(api.get("/api/insights"), []),
        safeApiCall(api.get(`/api/security/status?userId=${user.id}`), initialSecurityStatus),
        safeApiCall(api.get("/api/ai/file-naming-suggestions"), {}),
        safeApiCall(api.get("/api/dashboard/metrics"), {}),
        safeApiCall(api.get("/api/dashboard/activities"), []),
        safeApiCall(api.get("/api/platform/stats"), {})
      ]);

      setData({
        user: userData,
        recentFiles: userData.recentFiles || [],
        usage: userData.usage || {}
      });

      setMetrics({
        performance: {
          stats: perfStats,
          logs: perfLogs,
          live: metricsData?.performance || {}
        },
        storage: {
          usage: storageUsageData,
          cost: storageCostData,
          locations: storageLocationsData
        },
        fileInsights: insightsData
      });

      setSecurityStatus(securityData);
      setAiInsights(insightsData);
      setAiRecommendations(recommendationsData);
      setPlatformStats(platformSummaryData);

      setActivities(
        (activitiesData || []).map((a) => ({
          ...a,
          filenameSuggestion: filenameSuggestions?.[a.id] || null,
          aiInsight: insightsData?.activityInsights?.[a.id] || null
        }))
      );

      setRetryCount(0);
    } catch (err) {
      logError("Dashboard data fetch failed", err);
      setRetryCount((prev) => prev + 1);

      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(fetchDashboardData, delay);
      } else {
        setError("Failed to load dashboard data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, loggedIn, navigate, retryCount]);
  // WebSocket message handling
  useEffect(() => {
    if (!wsMessage) return;

    try {
      const msg = typeof wsMessage === "string" ? JSON.parse(wsMessage) : wsMessage;

      switch (msg.type) {
        case "metrics":
          setMetrics((prev) => ({
            ...prev,
            performance: {
              ...prev.performance,
              live: msg.data
            }
          }));
          break;

        case "activity":
          setActivities((prev) => [
            {
              ...msg.data,
              aiInsight: msg.insight,
              filenameSuggestion: msg.filenameSuggestion
            },
            ...prev.slice(0, 49)
          ]);
          break;

        case "security":
          setSecurityStatus((prev) => ({
            ...prev,
            ...msg.data
          }));
          break;

        case "ai_feedback":
          setAiLearningFeedback((prev) => [
            ...prev,
            msg.message
          ].slice(-10));
          break;

        default:
          logError("Unhandled WebSocket message type:", msg.type);
      }
    } catch (err) {
      logError("WebSocket message parse failure", err);
    }
  }, [wsMessage]);

  // Security event monitoring
  useEffect(() => {
    if (!user?.id) return;

    const handleSecurityEvent = async (newStatus) => {
      try {
        setSecurityStatus((prev) => ({ ...prev, ...newStatus }));

        // Optional: AI feedback from security monitoring
        const aiSecurityInsight = await import("@/services/ai/aiSecurityManager.js")
          .then((mod) => mod.analyzeSecurityChange(newStatus));

        if (aiSecurityInsight) {
          setAiInsights((prev) => [...prev, aiSecurityInsight]);
          setAiLearningFeedback((prev) =>
            [...prev, `Security event analyzed: ${aiSecurityInsight.message || "unknown"}`].slice(-10)
          );
        }
      } catch (err) {
        logError("Security event processing error", err);
      }
    };

    const unsubscribe = securityEvents.on(SECURITY_EVENTS.SECURITY_STATUS_CHANGED, handleSecurityEvent);

    return () => {
      unsubscribe?.();
      wsConnection?.close?.();
    };
  }, [user?.id, wsConnection]);

  // Initial dashboard load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Conditional UI States ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Loading your personalized dashboard...
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          AI is analyzing your latest activities
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="max-w-3xl mx-auto mt-12">
        <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
        <p>{error}</p>
        <div className="mt-4">
          <Button onClick={fetchDashboardData}>Retry Load</Button>
        </div>
      </Alert>
    );
  }

  // --- Main Render ---
  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8" data-testid="dashboard-content">
        {/* Platform Stats */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Platform Statistics</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Total Users: {platformStats.totalUsers}</li>
            <li>Total Files: {platformStats.totalFiles}</li>
            <li>Active Sessions: {platformStats.activeSessions}</li>
            <li>Storage Usage: {platformStats.totalStorageUsed || 0} GB</li>
          </ul>
        </section>

        {/* AI Overview */}
        <section className="mb-10">
          <AIOverviewPanel insights={aiInsights} feedback={aiLearningFeedback} />
        </section>

        {/* Storage Summary */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Storage Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">
                  Total Used: {metrics.storage.usage?.total || 0} GB
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Monthly Cost: ${metrics.storage.cost?.total || 0}
                </p>
              </CardContent>
            </Card>
            <StorageLocationDetails
              selected={selectedLocation}
              details={locationDetails}
              onSelect={setSelectedLocation}
            />
          </div>
        </section>

        {/* Security Console */}
        <section className="mb-8">
          <SecurityConsole status={securityStatus} />
        </section>

        {/* Forecast + Summary */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InsightSummaryWidget insights={aiInsights} />
            <AIForecastTrendWidget data={metrics.performance?.live || {}} />
          </div>
        </section>

        {/* Activity Feed */}
        <section className="mb-10">
          <ActivityFeed activities={activities} />
        </section>
      </div>
    </ErrorBoundary>
  );
}

export default Dashboard;

// ✅ FILE: /frontend/src/components/AdminDashboard.jsx

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import SecurityConsole from "./SecurityConsole";
import { securityEvents, SECURITY_EVENTS } from "../utils/security/eventEmitter";
import { useAuth } from "@/contexts";
import { logInfo, logError, logWarn } from "../utils/logging";
import ErrorBoundary from "@/utils/logging/ErrorBoundary";

export default function AdminDashboard() {
  // Core Admin State
  const [optimizations, setOptimizations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(true);

  // AI Persona State
  const [personas, setPersonas] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [namingHistory, setNamingHistory] = useState([]);
  const [personaError, setPersonaError] = useState("");

  // Security Enhancement State
  const [securityStats, setSecurityStats] = useState({
    activeUsers: 0,
    securityEvents: 0,
    failedLogins: 0,
    activeAlerts: 0,
    mfaEnrollment: 0,
    riskScore: 0
  });
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshInterval = useRef(null);
  const { user } = useAuth();

  // Enhanced Auth Headers
  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    "Content-Type": "application/json",
    "X-Client-Version": import.meta.env.VITE_APP_VERSION,
    "X-Admin-ID": user?.id
  };

  // Security Event Listener
  useEffect(() => {
    const handleSecurityEvent = (event) => {
      setSecurityStats(prev => ({
        ...prev,
        securityEvents: prev.securityEvents + 1
      }));

      if (event.severity === 'high' || event.severity === 'critical') {
        setSecurityAlerts(prev => [{
          id: event.eventId,
          type: event.type,
          message: event.data.message,
          timestamp: event.timestamp,
          severity: event.severity,
          acknowledged: false
        }, ...prev].slice(0, 10));

        // Log critical events
        if (event.severity === 'critical') {
          logError('Critical security event detected', event);
        }
      }
    };

    securityEvents.on(SECURITY_EVENTS.SECURITY_VIOLATION, handleSecurityEvent);
    securityEvents.on(SECURITY_EVENTS.API_BREACH, handleSecurityEvent);

    return () => {
      securityEvents.off(SECURITY_EVENTS.SECURITY_VIOLATION, handleSecurityEvent);
      securityEvents.off(SECURITY_EVENTS.API_BREACH, handleSecurityEvent);
    };
  }, []);

  // Auto-refresh Security Data
  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        fetchSecurityMetrics();
        fetchSystemStatus();
      }, 30000); // 30 second refresh
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh]);

  // Enhanced Data Loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const startTime = performance.now();

        const [optRes, logRes, metricRes, statusRes] = await Promise.all([
          fetch("/api/admin/ai-optimizations", { headers: authHeaders }),
          fetch("/api/admin/logs/latest", { headers: authHeaders }),
          fetch("/api/admin/metrics", { headers: authHeaders }),
          fetch("/api/admin/system-status", { headers: authHeaders })
        ]);

        // Enhanced error handling
        const responses = { optRes, logRes, metricRes, statusRes };
        for (const [key, res] of Object.entries(responses)) {
          if (!res.ok) {
            throw new Error(`${key} failed with status: ${res.status}`);
          }
        }

        const [optData, logData, metricData, statusData] = await Promise.all([
          optRes.json(),
          logRes.json(),
          metricRes.json(),
          statusRes.json()
        ]);

        setOptimizations(optData?.data || []);
        setLogs(logData?.logs || []);
        setMetrics(metricData?.metrics || {});
        setSystemStatus(statusData?.systemStatus || {});

        // Performance logging
        const loadTime = performance.now() - startTime;
        logInfo('Admin dashboard data loaded', { loadTimeMs: loadTime });

      } catch (err) {
        logError('Admin dashboard load failed', err);
        setAdminError(err.message);
        
        // Emit security event for repeated failures
        if (err.message.includes('status: 403')) {
          securityEvents.emit(SECURITY_EVENTS.SECURITY_VIOLATION, {
            type: 'UNAUTHORIZED_ADMIN_ACCESS',
            severity: 'high',
            data: { error: err.message }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Enhanced Optimization Approval
  const approveOptimization = async (id) => {
    try {
      const res = await fetch("/api/admin/ai-optimizations/approve", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ 
          id,
          approvedBy: user?.id,
          timestamp: new Date().toISOString()
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Approval failed");
      }

      setOptimizations((prev) => prev.filter((opt) => opt.id !== id));
      
      logInfo('Optimization approved', { 
        optimizationId: id, 
        adminId: user?.id 
      });

    } catch (err) {
      logError('Optimization approval failed', err);
      setAdminError(err.message);
    }
  };

  // Enhanced Log Management
  const downloadCSVLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs/download", { 
        headers: {
          ...authHeaders,
          'X-Export-Type': 'CSV',
          'X-Request-ID': crypto.randomUUID()
        }
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai_logs_${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      logInfo('Logs exported', { adminId: user?.id });

    } catch (err) {
      logError('Log export failed', err);
      setAdminError("CSV log download failed");
    }
  };

  // Enhanced Log Pruning
  const pruneLogs = async (days = 30) => {
    try {
      const res = await fetch(`/api/admin/logs/prune/${days}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
          'X-Confirmation': 'PRUNE_LOGS'
        }
      });

      if (!res.ok) throw new Error("Prune failed");

      const result = await res.json();
      logInfo('Logs pruned', { 
        days, 
        adminId: user?.id,
        count: result.prunedCount 
      });

      alert(result.message);

    } catch (err) {
      logError('Log pruning failed', err);
      setAdminError("Log pruning failed");
    }
  };

  // Enhanced AI Persona Management
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const res = await fetch("/api/admin/ai-personas", { headers: authHeaders });
        if (!res.ok) throw new Error("Failed to fetch AI personas");
        
        const data = await res.json();
        setPersonas(data?.personas || []);

      } catch (err) {
        logError('Persona fetch failed', err);
        setPersonaError(err.message);
      }
    };

    fetchPersonas();
  }, []);

  // Enhanced Naming History Fetch
  const fetchNamingHistory = async (userId) => {
    if (!userId?.trim()) {
      setPersonaError("Please enter a valid user ID");
      return;
    }

    try {
      const res = await fetch(`/api/admin/ai-user-naming/${userId}`, { 
        headers: authHeaders 
      });

      if (!res.ok) throw new Error("Failed to fetch naming history");

      const data = await res.json();
      setNamingHistory(data?.history || []);

      logInfo('Naming history fetched', { 
        userId, 
        adminId: user?.id 
      });

    } catch (err) {
      logError('Naming history fetch failed', err);
      setPersonaError(err.message);
    }
  };

  // Enhanced Template Management
  const updatePersonaTemplates = async (persona, templates) => {
    if (!templates?.length) {
      setPersonaError("Please provide valid templates");
      return;
    }

    try {
      const res = await fetch("/api/admin/ai-persona-template", {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ 
          persona, 
          templates,
          updatedBy: user?.id
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      const data = await res.json();
      alert(data.message);

      // Refresh persona list
      const refreshed = await fetch("/api/admin/ai-personas", { 
        headers: authHeaders 
      });
      const refreshedData = await refreshed.json();
      setPersonas(refreshedData?.personas || []);

      logInfo('Persona templates updated', { 
        persona, 
        adminId: user?.id 
      });

    } catch (err) {
      logError('Template update failed', err);
      setPersonaError(err.message);
    }
  };

  // Enhanced Template Deletion
  const deletePersonaTemplate = async (persona, template) => {
    if (!template?.trim()) {
      setPersonaError("Please provide a valid template");
      return;
    }

    try {
      const res = await fetch("/api/admin/ai-persona-template", {
        method: "DELETE",
        headers: authHeaders,
        body: JSON.stringify({ 
          persona, 
          template,
          deletedBy: user?.id
        }),
      });

      if (!res.ok) throw new Error("Template deletion failed");

      const data = await res.json();
      alert(data.message);

      // Refresh persona list
      const refreshed = await fetch("/api/admin/ai-personas", { 
        headers: authHeaders 
      });
      const refreshedData = await refreshed.json();
      setPersonas(refreshedData?.personas || []);

      logInfo('Persona template deleted', { 
        persona, 
        template,
        adminId: user?.id 
      });

    } catch (err) {
      logError('Template deletion failed', err);
      setPersonaError(err.message);
    }
  };

  // Security Alert Acknowledgment
  const acknowledgeAlert = async (alertId) => {
    try {
      const alert = securityAlerts.find(a => a.id === alertId);
      if (!alert) throw new Error("Alert not found");

      await fetch("/api/admin/security/acknowledge-alert", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ 
          alertId,
          acknowledgedBy: user?.id
        })
      });

      setSecurityAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a)
      );

      logInfo('Security alert acknowledged', { 
        alertId, 
        adminId: user?.id 
      });

    } catch (err) {
      logError('Alert acknowledgment failed', err);
      setAdminError("Failed to acknowledge alert");
    }
  };

  return (
    <ErrorBoundary>
      <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>

        {/* Error Displays */}
        {adminError && (
          <Alert className="mb-4 text-red-600" role="alert">
            {adminError}
          </Alert>
        )}
        {personaError && (
          <Alert className="mb-4 text-red-600" role="alert">
            {personaError}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center">
            <Spinner aria-label="Loading admin data" />
          </div>
        ) : (
          <>
            {/* Security Overview Section */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Security Overview</h2>
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`text-sm ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                >
                  {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
                </Button>
              </div>

              {/* Security Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries(securityStats).map(([key, value]) => (
                  <Card key={key} className="p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-600">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className="text-2xl font-bold">{value}</p>
                  </Card>
                ))}
              </div>

              {/* Security Alerts */}
              {securityAlerts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Active Security Alerts</h3>
                  <ul className="space-y-2">
                    {securityAlerts.map(alert => (
                      <li
                        key={alert.id}
                        className={`p-3 rounded ${
                          alert.severity === 'critical' 
                            ? 'bg-red-100 border-red-400' 
                            : alert.severity === 'high'
                            ? 'bg-orange-100 border-orange-400'
                            : 'bg-yellow-100 border-yellow-400'
                        } border`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold">{alert.type}</span>
                            <p className="text-sm mt-1">{alert.message}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-600">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                            {!alert.acknowledged && (
                              <Button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="ml-2 text-sm bg-gray-600 text-white"
                              >
                                Acknowledge
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* AI Optimizations Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">AI Optimizations</h2>
              {optimizations.length === 0 ? (
                <p className="text-gray-500">No pending optimizations.</p>
              ) : (
                optimizations.map((opt) => (
                  <Card
                    key={opt.id}
                    className="mb-3 border border-gray-300 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4">
                      <p className="text-lg text-gray-800 mb-2">
                        {opt.suggested_update || "Optimization suggestion"}
                      </p>
                      <Button
                        onClick={() => approveOptimization(opt.id)}
                        className="bg-green-600 text-white"
                      >
                        Approve & Apply
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </section>

            {/* System Metrics & Status Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded shadow">
                  <h3 className="font-semibold">Metrics</h3>
                  <ul className="list-disc list-inside text-gray-700">
                    <li>Total Users: {metrics?.totalUsers ?? "—"}</li>
                    <li>Optimizations: {metrics?.totalOptimizations ?? "—"}</li>
                    <li>Total Logs: {metrics?.totalLogs ?? "—"}</li>
                  </ul>
                </div>
                <div className="p-4 border rounded shadow">
                  <h3 className="font-semibold">System Status</h3>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(systemStatus, null, 2)}
                  </pre>
                </div>
              </div>
            </section>

            {/* Logs Management Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Recent Logs</h2>
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs available.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {logs.map((log) => (
                    <li key={log.id}>
                      <span className="text-gray-600">{log.timestamp}</span> —{" "}
                      <span className="text-black">{log.message}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex space-x-2">
                <Button onClick={downloadCSVLogs} className="bg-blue-500 text-white">
                  Download CSV
                </Button>
                <Button onClick={() => pruneLogs(30)} className="bg-red-500 text-white">
                  Prune Logs (30 days)
                </Button>
              </div>
            </section>

            {/* AI Persona Management Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">AI Persona Management</h2>
              {personas.length === 0 ? (
                <p className="text-gray-500">No AI personas found.</p>
              ) : (
                <ul className="list-disc list-inside text-gray-700">
                  {personas.map((persona) => (
                    <li key={persona}>
                      <span className="font-bold">{persona}</span>
                      <div className="mt-1 space-x-2">
                        <Button
                          onClick={() =>
                            updatePersonaTemplates(
                              persona,
                              prompt(`Update templates for ${persona} (comma-separated):`)?.split(",")
                            )
                          }
                          className="bg-yellow-500 text-white text-xs"
                        >
                          Update Templates
                        </Button>
                        <Button
                          onClick={() =>
                            deletePersonaTemplate(
                              persona,
                              prompt(`Enter template to delete for ${persona}:`)
                            )
                          }
                          className="bg-red-500 text-white text-xs"
                        >
                          Delete Template
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Fetch User Naming History</h3>
                <div className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    placeholder="Enter user ID"
                    className="border p-2 rounded"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                  <Button
                    onClick={() => fetchNamingHistory(selectedUserId)}
                    className="bg-blue-600 text-white"
                  >
                    Fetch History
                  </Button>
                </div>
                {namingHistory.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-semibold">Naming History for {selectedUserId}:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {namingHistory.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* Security Console Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Security Event Console</h2>
              <SecurityConsole 
                maxItems={200}
                onEventSelect={(event) => {
                  logInfo('Security event selected', { 
                    eventId: event.id,
                    adminId: user?.id
                  });
                }}
              />
            </section>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

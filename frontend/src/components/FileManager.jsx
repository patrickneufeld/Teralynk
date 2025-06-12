// ✅ FILE: /frontend/src/components/FileManager.jsx (Part 1 of 7)

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts";
import axios from "axios";

// UI COMPONENTS
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import Alert from "./ui/Alert";
import { Loader } from "./ui/Loader";
import ErrorBoundary from "@/utils/logging/ErrorBoundary";
import SecurityConsole from "@/components/SecurityConsole";

// AI SERVICES
import * as aiFileManager from "@/services/ai/aiFileManager";
import * as aiFileAnalyzer from "@/services/ai/aiFileAnalyzer";
import * as aiFileInsights from "@/services/ai/aiFileInsights";
import * as aiFileMonitor from "@/services/ai/aiFileMonitor";
import * as aiFileNamer from "@/services/ai/aiFileNamer";
import * as aiFileVersioning from "@/services/ai/aiFileVersioning";
import * as aiFileDebugger from "@/services/ai/aiFileDebugger";
import * as aiStorageOptimizer from "@/services/ai/aiStorageOptimizer";
import * as aiSecurityManager from "@/services/ai/aiSecurityManager";
import * as aiFileMetadataAnalyzer from "@/services/ai/aiFileMetadataAnalyzer";

// UTILS + SERVICES
import { logError, logInfo } from "@/utils/logging/logging";
import { securityEvents, SECURITY_EVENTS } from "@/utils/security/eventEmitter";
import * as analyticsService from "@/services/analyticsService";
import * as notificationService from "@/services/notificationService";
import formatFileSize from "@/utils/formatFileSize";
import { hasPermission } from "@/utils/authUtils"; // ✅ FIXED HERE
import { generateTraceId } from "@/utils/tracing";
import { sessionContext } from "@/utils/sessionManager";



// COMPONENT: Inline file insights
const FileInsightsPanel = ({ file, insights }) => (
  <div className="mt-4 p-4 bg-blue-50 rounded-lg dark:bg-blue-900/10">
    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
      🤖 AI Insights
    </h4>
    <ul className="mt-2 space-y-1">
      {insights.map((insight, index) => (
        <li key={index} className="text-sm text-blue-600 dark:text-blue-300">
          {insight}
        </li>
      ))}
    </ul>
  </div>
);

// COMPONENT: Security indicator
const FileSecurityBadge = ({ securityScore }) => {
  const getSecurityColor = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${getSecurityColor(securityScore)}`}>
      Security: {securityScore}%
    </span>
  );
};

// COMPONENT: Optimization flag
const FileOptimizationStatus = ({ status }) => (
  <div className="flex items-center space-x-2">
    <span className="text-sm font-medium">Optimization:</span>
    <span className={`px-2 py-1 rounded-full text-xs ${
      status.optimized ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
    }`}>
      {status.optimized ? "Optimized" : "Optimization Available"}
    </span>
  </div>
);

// STATEFUL CONTAINER
const FileManager = () => {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // UI + AI States
  const [files, setFiles] = useState([]);
  const [fileInsights, setFileInsights] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [aiAnalysisInProgress, setAiAnalysisInProgress] = useState(false);

  // RBAC-based access control
  const canManageFiles = useMemo(() => hasPermission(permissions, "files:manage"), [permissions]);

  // Session-aware AI context
  useEffect(() => {
    if (user?.id) {
      aiFileManager.setSessionContext({
        userId: user.id,
        orgId: user.orgId || "default",
        sessionId: sessionContext.getSessionId(),
        traceId: generateTraceId(),
      });
    }
  }, [user]);

  // Hardened headers with traceability + audit context
  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    "Content-Type": "application/json",
    "X-Client-Version": import.meta.env.VITE_APP_VERSION,
    "X-Request-ID": generateTraceId(),
    "X-User-ID": user?.id,
    "X-Session-ID": sessionContext.getSessionId(),
  }), [user?.id]);

// ⏭️ Continue to Part 2?
// ✅ FILE: /frontend/src/components/FileManager.jsx (Part 2 of 6)

// 🚀 Fetch files with AI augmentation and telemetry
const fetchFiles = useCallback(async () => {
  try {
    setLoadingFiles(true);

    const traceId = crypto.randomUUID();
    const perfTrackingId = await aiFileManager.startPerformanceTracking("fetch_files", { traceId, userId: user.id });

    const [filesResponse, insightsResponse] = await Promise.all([
      axios.get("/api/files", {
        headers: {
          ...authHeaders,
          "X-Trace-ID": traceId,
          "X-Timestamp": new Date().toISOString(),
        },
      }),
      aiFileInsights.batchAnalyzeFiles(user.id, { sessionId: traceId }),
    ]);

    const files = filesResponse.data.files || [];
    const insights = insightsResponse?.insights || {};

    const enhancedFiles = await Promise.all(files.map(async (file) => {
      const [
        securityScore,
        optimizationStatus,
        metadata,
        aiSuggestions,
      ] = await Promise.all([
        aiSecurityManager.analyzeFile(file, { traceId }),
        aiStorageOptimizer.checkOptimizationStatus(file),
        aiFileMetadataAnalyzer.analyze(file, { sessionId: traceId }),
        aiFileInsights.generateInsights(file, { contextId: traceId }),
      ]);

      return {
        ...file,
        securityScore,
        optimizationStatus,
        metadata,
        aiSuggestions,
        traceId,
      };
    }));

    setFiles(enhancedFiles);
    setFileInsights(insights);

    await aiFileManager.stopPerformanceTracking(perfTrackingId, {
      fileCount: files.length,
      success: true,
      sessionContext: traceId,
    });

    analyticsService.trackEvent("files_fetched", {
      userId: user.id,
      fileCount: files.length,
      hasInsights: Object.keys(insights).length > 0,
      traceId,
    });
  } catch (err) {
    logError("Fetch files error:", err);
    setError("Failed to load files.");
    securityEvents.emit(SECURITY_EVENTS.FILE_OPERATION_FAILED, {
      operation: "fetch",
      error: err,
      userId: user.id,
    });
  } finally {
    setLoadingFiles(false);
  }
}, [user, authHeaders]);

// 📡 AI Auto Suggestions (initial hint scan)
useEffect(() => {
  if (user?.id && canManageFiles) {
    aiFileManager.analyzeAndSuggest({
      userId: user.id,
      role: user.role,
      contextSource: "FileManager.jsx",
    }).then((suggestions) => {
      if (suggestions?.autoCategorize) {
        logInfo("AI FileManager: Auto-suggestion available", suggestions);
        notificationService.show({
          type: "info",
          message: "AI suggests organizing your files into categories.",
        });
      }
    }).catch((err) => {
      logError("AI FileManager suggestion error:", err);
    });
  }
}, [user, canManageFiles]);

// ⏬ Initial file loading
useEffect(() => {
  if (user && canManageFiles) {
    fetchFiles();
  }
}, [user, canManageFiles, fetchFiles]);

// 📂 Upload UI handler
const handleUploadClick = () => {
  fileInputRef.current?.click();
};
// ✅ FILE: /frontend/src/components/FileManager.jsx (Part 3 of 6)

// 📤 Handle AI-enhanced file upload
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);
  setError("");
  setSuccess("");
  setAiAnalysisInProgress(true);

  const traceId = crypto.randomUUID();

  try {
    const aiAnalysisId = await aiFileAnalyzer.startAnalysis(file, {
      userId: user.id,
      traceId,
      context: "upload",
    });

    const [
      securityCheck,
      optimizationSuggestions,
      suggestedName,
      contentAnalysis,
    ] = await Promise.all([
      aiSecurityManager.preUploadCheck(file, { traceId }),
      aiStorageOptimizer.analyzeBeforeUpload(file, { traceId }),
      aiFileNamer.suggestFileName(file, { userId: user.id }),
      aiFileAnalyzer.analyzeContent(file, { traceId }),
    ]);

    if (securityCheck.threatDetected) {
      throw new Error(`Security threat detected: ${securityCheck.threatDetails}`);
    }

    const enhancedMetadata = {
      ...contentAnalysis,
      aiGenerated: {
        suggestedName,
        contentType: contentAnalysis.detectedType,
        securityScore: securityCheck.score,
        optimizationAvailable: optimizationSuggestions.hasOptimizations,
        insights: contentAnalysis.insights,
      },
      traceId,
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(enhancedMetadata));
    formData.append("owner", user.email);
    formData.append("securityContext", JSON.stringify(securityCheck));
    formData.append("optimizationData", JSON.stringify(optimizationSuggestions));

    const response = await axios.post("/api/files/upload", formData, {
      headers: {
        ...authHeaders,
        "X-Trace-ID": traceId,
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        // optional: add telemetry hook here
      },
    });

    const uploadedFile = response.data.file;

    await Promise.all([
      aiFileVersioning.initializeVersion(uploadedFile, { traceId }),
      aiFileMonitor.startMonitoring(uploadedFile.id, { traceId }),
      aiFileMetadataAnalyzer.enrichMetadata(uploadedFile, { traceId }),
      aiStorageOptimizer.scheduleOptimization(uploadedFile, { traceId }),
      aiFileInsights.generateInitialInsights(uploadedFile, { contextId: traceId }),
    ]);

    const analysisResults = await aiFileAnalyzer.completeAnalysis(aiAnalysisId, { traceId });

    setFileInsights((prev) => ({
      ...prev,
      [uploadedFile.id]: analysisResults,
    }));

    setSuccess("File uploaded and analyzed successfully!");

    analyticsService.trackEvent("file_uploaded", {
      userId: user.id,
      fileId: uploadedFile.id,
      fileType: uploadedFile.type,
      hasOptimizations: optimizationSuggestions.hasOptimizations,
      securityScore: securityCheck.score,
      traceId,
    });

    fetchFiles();
  } catch (err) {
    logError("Upload error:", err);
    setError(err.message || "Failed to upload file.");
    securityEvents.emit(SECURITY_EVENTS.FILE_UPLOAD_FAILED, {
      error: err,
      userId: user.id,
      traceId,
      fileDetails: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
    });

    const errorAnalysis = await aiFileDebugger.analyzeError(err, { traceId });
    if (errorAnalysis.suggestedAction) {
      setError(`${err.message} - Suggestion: ${errorAnalysis.suggestedAction}`);
    }
  } finally {
    setUploading(false);
    setAiAnalysisInProgress(false);
  }
};
// ✅ FILE: /frontend/src/components/FileManager.jsx (Part 4 of 6)

// 📥 Handle AI-enhanced file download
const handleDownload = async (fileId) => {
  const traceId = crypto.randomUUID();

  try {
    const securityCheck = await aiSecurityManager.preDownloadCheck(fileId, {
      traceId,
      userId: user.id,
    });

    if (!securityCheck.safe) {
      throw new Error(`Security warning: ${securityCheck.warning}`);
    }

    await aiFileMonitor.logAccess(fileId, "download", user.id, { traceId });

    const response = await axios.get(`/api/files/${fileId}/download`, {
      responseType: "blob",
      headers: {
        ...authHeaders,
        "X-Trace-ID": traceId,
      },
    });

    const downloadedFile = new Blob([response.data]);
    const integrityCheck = await aiFileAnalyzer.verifyFileIntegrity(downloadedFile, { traceId });

    if (!integrityCheck.valid) {
      throw new Error("File integrity check failed");
    }

    const url = window.URL.createObjectURL(downloadedFile);
    const link = document.createElement("a");
    const disposition = response.headers["content-disposition"];
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] || "downloaded_file";

    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    analyticsService.trackEvent("file_downloaded", {
      userId: user.id,
      fileId,
      traceId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logError("Download error:", err);
    setError(err.message || "Failed to download file.");
    securityEvents.emit(SECURITY_EVENTS.FILE_DOWNLOAD_FAILED, {
      error: err,
      fileId,
      traceId,
      userId: user.id,
    });

    await aiFileDebugger.analyzeError(err, {
      traceId,
      context: "download",
      userId: user.id,
      fileId,
    });
  }
};

// 🗑️ Handle AI-enhanced file deletion
const handleDelete = async (fileId) => {
  const traceId = crypto.randomUUID();

  try {
    const [deletionImpact, versionInfo, usageAnalysis] = await Promise.all([
      aiFileAnalyzer.analyzeDeletionImpact(fileId, { traceId }),
      aiFileVersioning.getVersionHistory(fileId, { traceId }),
      aiFileMonitor.getFileUsageStats(fileId, { traceId }),
    ]);

    if (deletionImpact.hasHighImpact) {
      const confirmed = window.confirm(
        `⚠️ AI Warning: This file is heavily used.\n\n${deletionImpact.details}\n\nDelete anyway?`
      );
      if (!confirmed) return;
    }

    await Promise.all([
      axios.delete(`/api/files/${fileId}`, {
        headers: {
          ...authHeaders,
          "X-Trace-ID": traceId,
        },
      }),
      aiFileVersioning.cleanupVersions(fileId, { traceId }),
      aiFileMonitor.stopMonitoring(fileId, { traceId }),
      aiStorageOptimizer.cancelOptimizations(fileId, { traceId }),
    ]);

    setSuccess("File deleted successfully!");
    setFileInsights((prev) => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });

    analyticsService.trackEvent("file_deleted", {
      userId: user.id,
      fileId,
      traceId,
      impactLevel: deletionImpact.impactLevel,
      versionCount: versionInfo.length,
      lastAccessed: usageAnalysis.lastAccessed,
    });
  } catch (err) {
    logError("Delete error:", err);
    setError(err.message || "Failed to delete file.");
    securityEvents.emit(SECURITY_EVENTS.FILE_DELETION_FAILED, {
      error: err,
      fileId,
      userId: user.id,
      traceId,
    });

    await aiFileDebugger.analyzeError(err, {
      traceId,
      context: "deletion",
      fileId,
      userId: user.id,
    });
  }
};

useEffect(() => {
  if (user?.id) {
    fetchFiles();
  }
}, [user, fetchFiles]);
// ✅ FILE: /frontend/src/components/FileManager.jsx (Part 5 of 6)

return (
  <ErrorBoundary>
    <div className="p-6 max-w-6xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        📁 File Manager
      </h2>

      {error && <Alert type="error" message={error} className="mb-4" />}
      {success && <Alert type="success" message={success} className="mb-4" />}
      {(uploading || loadingFiles || aiAnalysisInProgress) && <Loader className="mb-4" />}

      {canManageFiles && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Upload a File</h3>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: "none" }}
              accept="*/*"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? "Uploading..." : "Choose File and Upload"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Your Uploaded Files
          </h3>

          {files.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No files uploaded yet.</p>
          ) : (
            <ul className="grid gap-4">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md flex flex-col md:flex-row md:items-center md:justify-between"
                  data-trace-id={file.traceId || ""}
                >
                  <div className="text-gray-800 dark:text-gray-200 space-y-1 w-full md:w-2/3">
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                      {formatFileSize(file.size)} • Uploaded:{" "}
                      {new Date(file.uploadedAt).toLocaleString()} • Owner: {file.owner}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <FileSecurityBadge securityScore={file.securityScore} />
                      <FileOptimizationStatus status={file.optimizationStatus} />
                    </div>
                    {file.aiSuggestions?.length > 0 && (
                      <FileInsightsPanel file={file} insights={file.aiSuggestions} />
                    )}
                  </div>

                  <div className="flex space-x-3 mt-4 md:mt-0 md:w-1/3 justify-end">
                    <Button
                      onClick={() => handleDownload(file.id)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      aria-label={`Download ${file.name}`}
                    >
                      Download
                    </Button>
                    {canManageFiles && (
                      <Button
                        onClick={() => handleDelete(file.id)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        aria-label={`Delete ${file.name}`}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      // ✅ FILE: /frontend/src/components/FileManager.jsx (Part 6 of 6)

// 🧠 AI Security Console + Self-Learning Loop UI
<div className="mt-10">
  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
    🔒 Security Events & AI Feedback
  </h3>
  <SecurityConsole
    maxItems={5}
    aiEnabled={true}
    traceable={true}
    onEventAnalyzed={(event) => {
      aiSecurityManager.analyzeSecurityEvent(event);
      logInfo("Security event re-analyzed via console", {
        event,
        userId: user?.id,
        traceId: event?.traceId || "none",
      });
    }}
    onExportCSV={() => {
      aiFileManager.exportSecurityLogs(user.id).then((csv) => {
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `security-log-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }}
  />
</div>

{/* Self-learning Session AI Observer */}
{user?.id && (
  <div className="mt-6">
    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
      AI models are continuously adapting to your file activity patterns for better suggestions and security.
    </p>
  </div>
)}

</div>
</ErrorBoundary>
);
};

export default FileManager;

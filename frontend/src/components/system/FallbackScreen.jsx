import React from "react";

export default function FallbackScreen({ title, message, stackTrace, reload = false }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#f8f9fa",
      color: "#dc3545",
      fontFamily: "system-ui, sans-serif",
      padding: "2rem",
      textAlign: "center",
      zIndex: 9999,
    }}>
      <h1>{title || "Critical Application Error"}</h1>
      <p>{message}</p>
      {stackTrace && (
        <pre style={{
          maxWidth: "90%",
          backgroundColor: "#fff",
          padding: "1rem",
          borderRadius: "5px",
          overflowX: "auto",
          marginTop: "1rem",
          textAlign: "left",
        }}>
          {stackTrace}
        </pre>
      )}
      {reload && (
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reload App
        </button>
      )}
    </div>
  );
}

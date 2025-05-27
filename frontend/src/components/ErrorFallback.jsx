export default function ErrorFallback({ error, resetErrorBoundary }) {
    return (
      <div className="error-fallback">
        <h2>Something went wrong</h2>
        <pre>{error.message}</pre>
        <button onClick={resetErrorBoundary}>Try again</button>
      </div>
    );
  }
export function init() {
    if (import.meta.env.PROD) {
      import('@sentry/react').then((Sentry) => {
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          integrations: [new Sentry.BrowserTracing()],
          tracesSampleRate: 0.2
        });
      });
    }
  }
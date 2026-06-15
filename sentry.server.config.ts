import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Debug mode — disable in production
  debug: false,
});

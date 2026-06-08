import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import type { ComponentType } from "react";

import { sanitizeLogPayload } from "@/lib/logging/sanitizeLogPayload";

declare const __DEV__: boolean;

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

let isSentryInitialized = false;
let isSentryEnabled = false;

function getSentryEnvironment(): string {
  return process.env.EXPO_PUBLIC_APP_ENV ?? process.env.APP_VARIANT ?? (__DEV__ ? "development" : "production");
}

function getSentryRelease(): string | undefined {
  const appVersion = Constants.expoConfig?.version;
  const nativeBuildVersion =
    Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode;

  if (!appVersion) {
    return undefined;
  }

  return nativeBuildVersion ? `tara@${appVersion}+${nativeBuildVersion}` : `tara@${appVersion}`;
}

function sanitizeSentryEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  const sanitizedEvent = sanitizeLogPayload(event);
  if (!sanitizedEvent || typeof sanitizedEvent !== "object") {
    return null;
  }

  const eventWithPrivacyFilters = sanitizedEvent as Sentry.ErrorEvent;

  if (eventWithPrivacyFilters.user?.id) {
    eventWithPrivacyFilters.user = {
      id: String(eventWithPrivacyFilters.user.id),
    };
  } else {
    eventWithPrivacyFilters.user = undefined;
  }

  if (eventWithPrivacyFilters.request) {
    eventWithPrivacyFilters.request = {
      ...eventWithPrivacyFilters.request,
      cookies: undefined,
      headers: undefined,
      query_string: undefined,
    };
  }

  return eventWithPrivacyFilters;
}

export function initializeSentry(): void {
  if (isSentryInitialized) {
    return;
  }

  isSentryInitialized = true;

  if (!sentryDsn) {
    return;
  }

  Sentry.init({
    beforeBreadcrumb(breadcrumb) {
      const sanitizedBreadcrumb = sanitizeLogPayload(breadcrumb);
      if (!sanitizedBreadcrumb || typeof sanitizedBreadcrumb !== "object") {
        return null;
      }

      return sanitizedBreadcrumb as Sentry.Breadcrumb;
    },
    beforeSend(event) {
      return sanitizeSentryEvent(event);
    },
    debug: __DEV__,
    dsn: sentryDsn,
    enableNativeFramesTracking: !isRunningInExpoGo(),
    enabled: true,
    environment: getSentryEnvironment(),
    integrations: [navigationIntegration],
    maxBreadcrumbs: 50,
    release: getSentryRelease(),
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 1 : 0.15,
  });

  isSentryEnabled = true;
}

export function registerSentryNavigationContainer(navigationContainerRef: unknown): void {
  if (!isSentryEnabled || !navigationContainerRef) {
    return;
  }

  type NavigationContainerRef = Parameters<typeof navigationIntegration.registerNavigationContainer>[0];
  navigationIntegration.registerNavigationContainer(navigationContainerRef as NavigationContainerRef);
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!isSentryEnabled) {
    return;
  }

  const normalizedError = error instanceof Error ? error : new Error("Non-error exception captured");
  const safeContext = sanitizeLogPayload(context);

  Sentry.withScope((scope) => {
    if (safeContext && typeof safeContext === "object") {
      for (const [key, value] of Object.entries(safeContext)) {
        scope.setExtra(key, value);
      }
    }

    if (!(error instanceof Error)) {
      scope.setExtra("non_error_value", sanitizeLogPayload(error));
    }

    Sentry.captureException(normalizedError);
  });
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, unknown>
): void {
  if (!isSentryEnabled) {
    return;
  }

  const safeMessage = sanitizeLogPayload(message);
  const safeContext = sanitizeLogPayload(context);

  Sentry.withScope((scope) => {
    if (safeContext && typeof safeContext === "object") {
      for (const [key, value] of Object.entries(safeContext)) {
        scope.setExtra(key, value);
      }
    }

    Sentry.captureMessage(
      typeof safeMessage === "string" ? safeMessage : "Sanitized monitoring message",
      level
    );
  });
}

export function setMonitoringUserId(userId?: string | null): void {
  if (!isSentryEnabled) {
    return;
  }

  if (userId) {
    Sentry.setUser({ id: String(userId) });
    return;
  }

  Sentry.setUser(null);
}

export function withSentryRoot<T extends ComponentType<unknown>>(Component: T): T {
  return Sentry.wrap(Component) as T;
}

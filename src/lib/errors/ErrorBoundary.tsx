import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { captureException } from "@/lib/monitoring/sentry";
import { colors, spacing } from "@/theme/tokens";

type ErrorBoundaryProps = PropsWithChildren<{
  onRetry?: () => void;
}>;

type ErrorBoundaryState = {
  hasError: boolean;
};

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureException(error, {
      componentStack: errorInfo.componentStack,
      source: "root_error_boundary",
    });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.screen}>
          <View style={styles.messageContainer}>
            <AppText style={styles.message} variant="subtitle">
              Something went wrong. Please restart Tara.
            </AppText>
            <View style={styles.action}>
              <Button onPress={this.handleRetry} title="Try again" variant="secondary" />
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children, onRetry }: ErrorBoundaryProps) {
  return <RootErrorBoundary onRetry={onRetry}>{children}</RootErrorBoundary>;
}

const styles = StyleSheet.create({
  action: {
    marginTop: spacing.md,
    minWidth: 180,
  },
  screen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  message: {
    textAlign: "center",
  },
  messageContainer: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 320,
  },
});

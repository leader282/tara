import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { captureException } from "@/lib/monitoring/sentry";
import { colors, layout, spacing } from "@/theme/tokens";

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
            <BrandMark size={56} />
            <View style={styles.copy}>
              <AppText align="center" variant="headline">
                Something went wrong
              </AppText>
              <AppText align="center" color="textSecondary" variant="bodyMuted">
                Your space is safe. Try again, or restart Tara if this keeps happening.
              </AppText>
            </View>
            <Button icon="refresh" onPress={this.handleRetry} style={styles.action} title="Try again" />
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
  screen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: layout.gutter,
  },
  messageContainer: {
    alignItems: "center",
    gap: spacing.xl,
    maxWidth: 340,
  },
  copy: {
    gap: spacing.sm,
  },
  action: {
    minWidth: 200,
  },
});

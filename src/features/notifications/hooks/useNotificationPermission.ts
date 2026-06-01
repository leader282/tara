import { useCallback, useEffect, useMemo, useState } from "react";

import type { NotificationPermissionSnapshot } from "@/features/notifications/types";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from "@/features/notifications/services/notificationPermissions";
import { toNotificationActionMessage } from "@/lib/errors/notificationErrorMessages";

type UseNotificationPermissionState = {
  permission: NotificationPermissionSnapshot | null;
  isLoading: boolean;
  error: string | null;
};

const INITIAL_STATE: UseNotificationPermissionState = {
  permission: null,
  isLoading: true,
  error: null,
};

export function useNotificationPermission() {
  const [state, setState] = useState<UseNotificationPermissionState>(INITIAL_STATE);

  const refreshPermissionStatus = useCallback(async () => {
    try {
      const permission = await getNotificationPermissionStatus();
      setState({
        permission,
        isLoading: false,
        error: null,
      });

      return permission;
    } catch (error) {
      setState((previousState) => ({
        permission: previousState.permission,
        isLoading: false,
        error: toNotificationActionMessage(error),
      }));
      throw error;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const permission = await requestNotificationPermission();
      setState({
        permission,
        isLoading: false,
        error: null,
      });

      return permission;
    } catch (error) {
      setState((previousState) => ({
        permission: previousState.permission,
        isLoading: false,
        error: toNotificationActionMessage(error),
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const permission = await getNotificationPermissionStatus();
        if (!isMounted) {
          return;
        }

        setState({
          permission,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          permission: null,
          isLoading: false,
          error: toNotificationActionMessage(error),
        });
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const status = state.permission?.status ?? "undetermined";
  const canAskAgain = state.permission?.canAskAgain ?? false;
  const isGranted = state.permission?.isGranted ?? false;

  return useMemo(
    () => ({
      permission: state.permission,
      status,
      canAskAgain,
      isGranted,
      isLoading: state.isLoading,
      error: state.error,
      refreshPermissionStatus,
      requestPermission,
    }),
    [
      state.permission,
      state.isLoading,
      state.error,
      status,
      canAskAgain,
      isGranted,
      refreshPermissionStatus,
      requestPermission,
    ],
  );
}

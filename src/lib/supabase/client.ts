import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createClient,
  processLock,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

type AuthOptions = NonNullable<SupabaseClientOptions<"public">["auth"]>;
type AuthStorage = NonNullable<AuthOptions["storage"]>;

const authStorage: AuthStorage = {
  getItem: (key) => {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },
  removeItem: async (key) => {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
};

const authOptions: AuthOptions = {
  storage: authStorage,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  lock: processLock,
};

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: authOptions,
  }
);

let appStateSubscription: { remove: () => void } | null = null;

function handleAppStateChange(nextAppState: AppStateStatus): void {
  if (nextAppState === "active") {
    supabase.auth.startAutoRefresh();
    return;
  }

  supabase.auth.stopAutoRefresh();
}

export function startSupabaseAutoRefresh(): void {
  if (appStateSubscription) {
    return;
  }

  handleAppStateChange(AppState.currentState);
  appStateSubscription = AppState.addEventListener("change", handleAppStateChange);
}

export function stopSupabaseAutoRefresh(): void {
  if (!appStateSubscription) {
    return;
  }

  appStateSubscription.remove();
  appStateSubscription = null;
  supabase.auth.stopAutoRefresh();
}

import * as SecureStore from "expo-secure-store";

import { AppError } from "@/lib/errors/AppError";

export async function isSecureStoreAvailable(): Promise<boolean> {
  return SecureStore.isAvailableAsync();
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    throw new AppError(
      "STORAGE",
      `Failed to read secure key "${key}" from storage.`,
      error
    );
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    throw new AppError(
      "STORAGE",
      `Failed to write secure key "${key}" to storage.`,
      error
    );
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    throw new AppError(
      "STORAGE",
      `Failed to delete secure key "${key}" from storage.`,
      error
    );
  }
}

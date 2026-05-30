import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppError } from "@/lib/errors/AppError";

export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    throw new AppError("STORAGE", `Failed to read key "${key}" from storage.`, error);
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    throw new AppError("STORAGE", `Failed to write key "${key}" to storage.`, error);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    throw new AppError(
      "STORAGE",
      `Failed to remove key "${key}" from storage.`,
      error
    );
  }
}

export async function setJsonItem<T>(key: string, value: T): Promise<void> {
  await setItem(key, JSON.stringify(value));
}

export async function getJsonItem<T>(key: string): Promise<T | null> {
  const rawValue = await getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    throw new AppError("STORAGE", `Failed to parse JSON at key "${key}".`, error);
  }
}

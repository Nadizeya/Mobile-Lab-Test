import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function getPersistentItem(key: string): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }
  } catch {
    // Continue with web localStorage fallback.
  }

  const webStorage = getWebStorage();
  if (!webStorage) {
    return null;
  }

  try {
    return webStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setPersistentItem(key: string, value: string): Promise<void> {
  let wasStored = false;
  let asyncStorageError: unknown = null;

  try {
    await AsyncStorage.setItem(key, value);
    wasStored = true;
  } catch (error) {
    asyncStorageError = error;
  }

  const webStorage = getWebStorage();
  if (webStorage) {
    try {
      webStorage.setItem(key, value);
      wasStored = true;
    } catch {
      // Ignore web storage failure and report below if nothing was saved.
    }
  }

  if (!wasStored) {
    if (asyncStorageError instanceof Error) {
      throw asyncStorageError;
    }

    throw new Error('Unable to save data in browser storage.');
  }
}

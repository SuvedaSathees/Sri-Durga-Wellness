/**
 * The refresh token lives only in the iOS Keychain / Android Keystore (expo-secure-store),
 * readable only while the device is unlocked and never included in backups to other devices.
 */
import * as SecureStore from "expo-secure-store";
import type { SecureStorage } from "@sdw/core/api";

const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const secureStorage: SecureStorage = {
  getItem: (key) => SecureStore.getItemAsync(key, options),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, options),
  removeItem: (key) => SecureStore.deleteItemAsync(key, options),
};

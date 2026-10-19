/** Non-sensitive preferences (cart contents, language) in AsyncStorage. Never tokens or personal data. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PreferenceStorage } from "@sdw/controllers";

export const preferences: PreferenceStorage = {
  getItem: (key) => AsyncStorage.getItem(key).catch(() => null),
  setItem: (key, value) => AsyncStorage.setItem(key, value).catch(() => undefined),
  removeItem: (key) => AsyncStorage.removeItem(key).catch(() => undefined),
};

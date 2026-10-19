/**
 * Opening things outside the app. Web pages open in an in-app browser (SFSafariViewController /
 * Chrome Custom Tabs); phone, email, WhatsApp and UPI links go to the system.
 */
import { Alert, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { tokens } from "@sdw/tokens";

export async function openWebPage(url: string): Promise<void> {
  if (!/^https:\/\//i.test(url)) return;
  await WebBrowser.openBrowserAsync(url, {
    toolbarColor: tokens.color.bg,
    controlsColor: tokens.color.primary,
    dismissButtonStyle: "close",
  });
}

/**
 * tel:, mailto:, upi:// and https://wa.me links. Resolves false when no app can handle it, so the
 * screen can offer an alternative (for UPI: copy the UPI ID).
 */
export async function openExternal(url: string, failureMessage?: { title: string; body: string }): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    if (failureMessage) Alert.alert(failureMessage.title, failureMessage.body);
    return false;
  }
}

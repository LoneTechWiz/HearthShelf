import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "hearthshelf.mobileToken"
const PUSH_ENABLED_KEY = "hearthshelf.pushEnabled"

export async function getMobileToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getPushEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PUSH_ENABLED_KEY)) === "true"
}

export async function setPushEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(PUSH_ENABLED_KEY, "true")
    return
  }
  await SecureStore.deleteItemAsync(PUSH_ENABLED_KEY)
}

export async function setMobileToken(token: string | null): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    return
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

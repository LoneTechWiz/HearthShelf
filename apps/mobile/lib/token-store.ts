import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "hearthshelf.mobileToken"

export async function getMobileToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setMobileToken(token: string | null): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    return
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

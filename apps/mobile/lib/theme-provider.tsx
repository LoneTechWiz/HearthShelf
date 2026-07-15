import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { PropsWithChildren } from "react"
import { Appearance, useColorScheme } from "react-native"
import * as SecureStore from "expo-secure-store"

export type ThemePreference = "system" | "light" | "dark"

type ThemeContextValue = {
  colorScheme: "light" | "dark"
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const storageKey = "hearthshelf.theme"
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: PropsWithChildren) {
  const deviceColorScheme = useColorScheme() ?? "light"
  const [preference, setPreferenceState] = useState<ThemePreference>("system")

  useEffect(() => {
    let active = true

    void SecureStore.getItemAsync(storageKey)
      .then((storedPreference) => {
        if (!active || !isThemePreference(storedPreference)) return
        setPreferenceState(storedPreference)
        applyPreference(storedPreference)
      })
      .catch((error) => console.warn("Could not restore appearance preference", error))

    return () => {
      active = false
    }
  }, [])

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference)
    applyPreference(nextPreference)
    void SecureStore.setItemAsync(storageKey, nextPreference)
      .catch((error) => console.warn("Could not save appearance preference", error))
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({
    colorScheme: preference === "system" ? deviceColorScheme : preference,
    preference,
    setPreference,
  }), [deviceColorScheme, preference, setPreference])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used within ThemeProvider")
  return value
}

function applyPreference(preference: ThemePreference) {
  Appearance.setColorScheme(preference === "system" ? null : preference)
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark"
}

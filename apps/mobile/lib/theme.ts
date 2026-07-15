import { DynamicColorIOS, Platform } from "react-native"

function adaptiveColor(light: string, dark: string): string {
  if (Platform.OS !== "ios") return light
  return DynamicColorIOS({ light, dark }) as unknown as string
}

export const colors = {
  background: adaptiveColor("#faf6f0", "#161210"),
  surface: adaptiveColor("#fffdfa", "#211b16"),
  surfaceRaised: adaptiveColor("#f3ecdf", "#2c241d"),
  ink: adaptiveColor("#2b211b", "#f2ece3"),
  muted: adaptiveColor("#6b5d52", "#b3a394"),
  faint: adaptiveColor("#7d6c5b", "#9a8b7a"),
  edge: adaptiveColor("#e8e0d4", "#372e26"),
  accent: adaptiveColor("#a84a08", "#e08a3c"),
  accentHover: adaptiveColor("#93430a", "#eda05c"),
  accentContrast: adaptiveColor("#ffffff", "#231405"),
  accentSoft: adaptiveColor("#f7e8d8", "#3a2a1a"),
  success: adaptiveColor("#047857", "#6ee7b7"),
  successSoft: adaptiveColor("#dff6e7", "#16382e"),
  warning: adaptiveColor("#b45309", "#f6c453"),
  warningSoft: adaptiveColor("#fff1c2", "#3b2d16"),
  danger: adaptiveColor("#b42318", "#fca5a5"),
  dangerSoft: adaptiveColor("#fee4e2", "#421f1f"),
  dangerEdge: adaptiveColor("#f2b8b5", "#6b3030"),
  dangerPressed: adaptiveColor("#fbd0cd", "#552525"),
  overlay: adaptiveColor("rgba(43, 33, 27, 0.08)", "rgba(242, 236, 227, 0.10)"),
  primary: adaptiveColor("#a84a08", "#e08a3c"),
  primaryInk: "#ffffff",
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
}

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
}

export const shadows = {
  card: {
    shadowColor: adaptiveColor("#2b211b", "#000000"),
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
}

export const typography = {
  eyebrow: { fontSize: 12, fontWeight: "800" as const, lineHeight: 16 },
  screenTitle: { fontSize: 30, fontWeight: "800" as const, lineHeight: 36 },
  sectionTitle: { fontSize: 18, fontWeight: "800" as const, lineHeight: 23 },
  body: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "800" as const, lineHeight: 18 },
  control: { fontSize: 14, fontWeight: "800" as const, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
}

export const pressableRipple = { color: colors.overlay }

export const colors = {
  background: "#faf6f0",
  surface: "#fffdfa",
  surfaceRaised: "#f3ecdf",
  ink: "#2b211b",
  muted: "#6b5d52",
  faint: "#7d6c5b",
  edge: "#e8e0d4",
  accent: "#a84a08",
  accentHover: "#93430a",
  accentContrast: "#ffffff",
  accentSoft: "#f7e8d8",
  success: "#047857",
  successSoft: "#dff6e7",
  warning: "#b45309",
  warningSoft: "#fff1c2",
  danger: "#b42318",
  dangerSoft: "#fee4e2",
  dangerEdge: "#f2b8b5",
  dangerPressed: "#fbd0cd",
  overlay: "rgba(43, 33, 27, 0.08)",
  primary: "#a84a08",
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
    shadowColor: "#2b211b",
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

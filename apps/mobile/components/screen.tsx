import type { PropsWithChildren, ReactNode } from "react"
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, radii, shadows, spacing } from "../lib/theme"

type ScreenProps = PropsWithChildren<{
  title: string
  subtitle?: string
  action?: { label: string; onPress: () => void }
  eyebrow?: string
}>

type ButtonProps = {
  label: string
  onPress: () => void
  disabled?: boolean
  fullWidth?: boolean
}

type PillTone = "neutral" | "accent" | "success" | "warning" | "danger"

export function Screen({ title, subtitle, action, eyebrow, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {action ? <Button label={action.label} onPress={action.onPress} /> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

export function Button({ label, onPress, disabled, fullWidth }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

export function SecondaryButton({ label, onPress, disabled, fullWidth }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryButton,
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.secondaryButtonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  )
}

export function DangerButton({ label, onPress, disabled, fullWidth }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.dangerButton,
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.dangerButtonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
    >
      <Text style={styles.dangerButtonText}>{label}</Text>
    </Pressable>
  )
}

export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function StatusText({ children, tone = "neutral" }: PropsWithChildren<{ tone?: PillTone }>) {
  return <Text style={[styles.status, tone === "danger" && styles.statusDanger]}>{children}</Text>
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  )
}

export function Pill({ label, tone = "neutral" }: { label: string; tone?: PillTone }) {
  return (
    <View style={[styles.pill, pillStyle(tone)]}>
      <View style={[styles.pillDot, pillDotStyle(tone)]} />
      <Text style={[styles.pillText, pillTextStyle(tone)]}>{label}</Text>
    </View>
  )
}

export function StatusBadge({ checkedOut }: { checkedOut: boolean }) {
  return (
    <Pill
      label={checkedOut ? "Checked out" : "Available"}
      tone={checkedOut ? "warning" : "success"}
    />
  )
}

export function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: number
  tone?: PillTone
}) {
  return (
    <Card style={styles.metricCard}>
      <Text style={[styles.metricValue, tone === "danger" && styles.metricDanger]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  )
}

export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card style={styles.stateCard}>
      <Text style={styles.errorTitle}>Unable to load</Text>
      <Text style={styles.status}>{message}</Text>
      <SecondaryButton label="Retry" onPress={onRetry} fullWidth />
    </Card>
  )
}

export function EmptyState({
  title = "Nothing here yet",
  message,
  action,
}: {
  title?: string
  message: string
  action?: ReactNode
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <View style={styles.emptyIconLine} />
        <View style={[styles.emptyIconLine, styles.emptyIconLineShort]} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={[styles.status, styles.emptyMessage]}>{message}</Text>
      {action}
    </View>
  )
}

function pillStyle(tone: PillTone) {
  if (tone === "accent") return styles.pillAccent
  if (tone === "success") return styles.pillSuccess
  if (tone === "warning") return styles.pillWarning
  if (tone === "danger") return styles.pillDanger
  return styles.pillNeutral
}

function pillDotStyle(tone: PillTone) {
  if (tone === "accent") return styles.pillDotAccent
  if (tone === "success") return styles.pillDotSuccess
  if (tone === "warning") return styles.pillDotWarning
  if (tone === "danger") return styles.pillDotDanger
  return styles.pillDotNeutral
}

function pillTextStyle(tone: PillTone) {
  if (tone === "accent") return styles.pillTextAccent
  if (tone === "success") return styles.pillTextSuccess
  if (tone === "warning") return styles.pillTextWarning
  if (tone === "danger") return styles.pillTextDanger
  return styles.pillTextNeutral
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  buttonPressed: {
    backgroundColor: colors.accentHover,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.accentContrast,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.surfaceRaised,
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderColor: "#f2b8b5",
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dangerButtonPressed: {
    backgroundColor: "#fbd0cd",
    transform: [{ scale: 0.98 }],
  },
  dangerButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "800",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  stateCard: {
    shadowOpacity: 0,
    elevation: 0,
  },
  status: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "left",
  },
  statusDanger: {
    color: colors.danger,
    fontWeight: "700",
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  pill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillNeutral: {
    backgroundColor: colors.surfaceRaised,
  },
  pillAccent: {
    backgroundColor: colors.accentSoft,
  },
  pillSuccess: {
    backgroundColor: colors.successSoft,
  },
  pillWarning: {
    backgroundColor: colors.warningSoft,
  },
  pillDanger: {
    backgroundColor: colors.dangerSoft,
  },
  pillDot: {
    borderRadius: radii.pill,
    height: 6,
    width: 6,
  },
  pillDotNeutral: {
    backgroundColor: colors.faint,
  },
  pillDotAccent: {
    backgroundColor: colors.accent,
  },
  pillDotSuccess: {
    backgroundColor: colors.success,
  },
  pillDotWarning: {
    backgroundColor: colors.warning,
  },
  pillDotDanger: {
    backgroundColor: colors.danger,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  pillTextNeutral: {
    color: colors.muted,
  },
  pillTextAccent: {
    color: colors.accent,
  },
  pillTextSuccess: {
    color: colors.success,
  },
  pillTextWarning: {
    color: colors.warning,
  },
  pillTextDanger: {
    color: colors.danger,
  },
  metricCard: {
    flex: 1,
    minWidth: "46%",
    paddingVertical: spacing.md,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  metricDanger: {
    color: colors.danger,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 17,
    fontWeight: "800",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    gap: spacing.xs,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  emptyIconLine: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    height: 3,
    width: 20,
  },
  emptyIconLineShort: {
    opacity: 0.6,
    width: 14,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  emptyMessage: {
    textAlign: "center",
  },
})

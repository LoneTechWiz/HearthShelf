import type { PropsWithChildren } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { colors, spacing } from "../lib/theme"

type ScreenProps = PropsWithChildren<{
  title: string
  subtitle?: string
  action?: { label: string; onPress: () => void }
}>

export function Screen({ title, subtitle, action, children }: ScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action ? <Button label={action.label} onPress={action.onPress} /> : null}
      </View>
      {children}
    </ScrollView>
  )
}

export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.secondaryButton} onPress={onPress}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  )
}

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>
}

export function StatusText({ children }: PropsWithChildren) {
  return <Text style={styles.status}>{children}</Text>
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
    <Card>
      <Text style={styles.errorTitle}>Unable to load</Text>
      <Text style={styles.status}>{message}</Text>
      <SecondaryButton label="Retry" onPress={onRetry} />
    </Card>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <Text style={styles.status}>{message}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.primaryInk,
    fontWeight: "700",
  },
  secondaryButton: {
    alignSelf: "flex-start",
    borderColor: colors.edge,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  status: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "700",
  },
  center: {
    alignItems: "center",
    padding: spacing.xl,
  },
})

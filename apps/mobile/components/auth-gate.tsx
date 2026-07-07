import type { PropsWithChildren } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useAuth } from "../lib/auth"
import { Button, Card, LoadingState, Pill, Screen, SecondaryButton, StatusText } from "./screen"
import { colors, radii, spacing } from "../lib/theme"

export function AuthGate({ children }: PropsWithChildren) {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <Screen title="HearthShelf" subtitle="Connecting to your shelf." eyebrow="Mobile">
        <Card style={styles.loadingCard}>
          <LoadingState />
          <StatusText>Checking your mobile session...</StatusText>
        </Card>
      </Screen>
    )
  }

  if (auth.user) return <>{children}</>

  return (
    <Screen title="HearthShelf" subtitle="Your books, movies, and games in one native shelf." eyebrow="Mobile">
      <Card>
        <View style={styles.brandMark}>
          <View style={styles.brandShelf} />
          <View style={[styles.brandShelf, styles.brandShelfShort]} />
          <View style={[styles.brandShelf, styles.brandShelfLong]} />
        </View>
        <View style={styles.copy}>
          <Pill label="Secure sync" tone="accent" />
          <Text style={styles.title}>Sign in to your shelf</Text>
          <StatusText>
            Use your HearthShelf account to sync your library, checkouts, collections,
            contacts, and events on this device.
          </StatusText>
        </View>
        {auth.error ? <StatusText tone="danger">{auth.error}</StatusText> : null}
        <View style={styles.actions}>
          <Button label="Continue with HearthShelf" onPress={() => void auth.openSignIn()} fullWidth />
          <SecondaryButton label="Refresh Session" onPress={() => void auth.refresh()} fullWidth />
        </View>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  loadingCard: {
    alignItems: "center",
  },
  brandMark: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.xl,
    gap: spacing.xs,
    height: 78,
    justifyContent: "center",
    width: 78,
  },
  brandShelf: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    height: 4,
    width: 34,
  },
  brandShelfShort: {
    opacity: 0.7,
    width: 26,
  },
  brandShelfLong: {
    opacity: 0.45,
    width: 40,
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    textAlign: "center",
  },
  actions: {
    gap: spacing.sm,
  },
})

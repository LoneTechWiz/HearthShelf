import { useCallback } from "react"
import { Platform, StyleSheet, Text } from "react-native"
import * as Notifications from "expo-notifications"
import { IosAuthorizationStatus } from "expo-notifications"
import { AuthGate } from "../../components/auth-gate"
import { Button, Card, EmptyState, ErrorState, LoadingState, Screen, SecondaryButton } from "../../components/screen"
import { getContacts, getEvents, registerPushToken } from "../../lib/api"
import { useAuth } from "../../lib/auth"
import { colors } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function MoreScreen() {
  const auth = useAuth()
  const loadContacts = useCallback(() => getContacts(), [])
  const loadEvents = useCallback(() => getEvents(), [])
  const contacts = useCachedQuery("contacts", loadContacts)
  const events = useCachedQuery("events", loadEvents)

  async function enablePush() {
    const permission = await Notifications.requestPermissionsAsync()
    if (Platform.OS === "ios" && permission.ios?.status !== IosAuthorizationStatus.AUTHORIZED) {
      return
    }
    const token = await Notifications.getExpoPushTokenAsync()
    await registerPushToken(token.data, Platform.OS)
  }

  return (
    <AuthGate>
      <Screen title="More" subtitle={auth.user?.email ?? undefined}>
        <Card>
          <Text style={styles.title}>Account</Text>
          <SecondaryButton label="Refresh session" onPress={() => void auth.refresh()} />
          <SecondaryButton label="Enable push notifications" onPress={() => void enablePush()} />
          <Button label="Sign out locally" onPress={() => void auth.signOutLocal()} />
        </Card>

        <Card>
          <Text style={styles.title}>Events</Text>
          {events.loading ? <LoadingState /> : null}
          {events.error ? <ErrorState message={events.error} onRetry={() => void events.reload()} /> : null}
          {events.data?.events.map((event) => (
            <Text key={event.id} style={styles.muted}>
              {event.title} · {new Date(event.startsAt).toLocaleDateString()}
            </Text>
          ))}
          {!events.loading && !events.error && events.data?.events.length === 0 ? (
            <EmptyState message="No events scheduled." />
          ) : null}
        </Card>

        <Card>
          <Text style={styles.title}>Contacts</Text>
          {contacts.loading ? <LoadingState /> : null}
          {contacts.error ? <ErrorState message={contacts.error} onRetry={() => void contacts.reload()} /> : null}
          {contacts.data?.contacts.map((contact) => (
            <Text key={contact.id} style={styles.muted}>{contact.name}</Text>
          ))}
          {!contacts.loading && !contacts.error && contacts.data?.contacts.length === 0 ? (
            <EmptyState message="No contacts yet." />
          ) : null}
        </Card>
      </Screen>
    </AuthGate>
  )
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
  },
})

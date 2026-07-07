import { useCallback, useState } from "react"
import { Image, Platform, StyleSheet, Text, View } from "react-native"
import * as Notifications from "expo-notifications"
import { IosAuthorizationStatus } from "expo-notifications"
import { AuthGate } from "../../components/auth-gate"
import { Button, Card, EmptyState, ErrorState, LoadingState, Pill, Screen, SecondaryButton, SectionHeader, StatusText } from "../../components/screen"
import { getContacts, getEvents, registerPushToken } from "../../lib/api"
import { useAuth } from "../../lib/auth"
import { colors, radii, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function MoreScreen() {
  const auth = useAuth()
  const [pushStatus, setPushStatus] = useState<string | null>(null)
  const loadContacts = useCallback(() => getContacts(), [])
  const loadEvents = useCallback(() => getEvents(), [])
  const contacts = useCachedQuery("contacts", loadContacts)
  const events = useCachedQuery("events", loadEvents)

  async function enablePush() {
    const permission = await Notifications.requestPermissionsAsync()
    if (Platform.OS === "ios" && permission.ios?.status !== IosAuthorizationStatus.AUTHORIZED) {
      setPushStatus("Push permission was not granted.")
      return
    }
    const token = await Notifications.getExpoPushTokenAsync()
    await registerPushToken(token.data, Platform.OS)
    setPushStatus("Push notifications are enabled for this device.")
  }

  return (
    <AuthGate>
      <Screen title="More" subtitle={auth.user?.email ?? undefined}>
        <Card>
          <View style={styles.accountTop}>
            {auth.user?.image ? (
              <Image source={{ uri: auth.user.image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials(auth.user?.name ?? auth.user?.email)}</Text>
              </View>
            )}
            <View style={styles.accountText}>
              <Text style={styles.accountName} numberOfLines={1}>{auth.user?.name ?? "HearthShelf account"}</Text>
              {auth.user?.email ? <Text style={styles.muted} numberOfLines={1}>{auth.user.email}</Text> : null}
            </View>
          </View>
          {auth.error ? <StatusText tone="danger">{auth.error}</StatusText> : null}
          {pushStatus ? <StatusText>{pushStatus}</StatusText> : null}
          <View style={styles.actions}>
            <SecondaryButton label="Refresh Session" onPress={() => void auth.refresh()} fullWidth />
            <SecondaryButton label="Enable Push" onPress={() => void enablePush()} fullWidth />
            <Button label="Sign Out Locally" onPress={() => void auth.signOutLocal()} fullWidth />
          </View>
        </Card>

        <View style={styles.section}>
          <SectionHeader title="Events" subtitle="Upcoming shelf plans." />
          {events.loading ? <LoadingState /> : null}
          {events.error ? <ErrorState message={events.error} onRetry={() => void events.reload()} /> : null}
          {events.data?.events.length ? (
            <Card style={styles.listCard}>
              {events.data.events.map((event, index) => (
                <View key={event.id} style={[styles.listRow, index < events.data!.events.length - 1 && styles.divider]}>
                  <View style={styles.rowText}>
                    <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.muted} numberOfLines={1}>{event.items.length} {event.items.length === 1 ? "item" : "items"}</Text>
                  </View>
                  <View style={styles.rowPills}>
                    <Pill label={event.type.replace("_", " ")} tone="accent" />
                    <Pill label={formatShortDate(event.startsAt)} />
                  </View>
                </View>
              ))}
            </Card>
          ) : null}
          {!events.loading && !events.error && events.data?.events.length === 0 ? (
            <EmptyState title="No events scheduled" message="Book clubs, movie nights, and game nights will show here." />
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Contacts" subtitle="People connected to your shelf." />
          {contacts.loading ? <LoadingState /> : null}
          {contacts.error ? <ErrorState message={contacts.error} onRetry={() => void contacts.reload()} /> : null}
          {contacts.data?.contacts.length ? (
            <Card style={styles.listCard}>
              {contacts.data.contacts.map((contact, index) => (
                <View key={contact.id} style={[styles.listRow, index < contacts.data!.contacts.length - 1 && styles.divider]}>
                  <View style={styles.contactMark}>
                    <Text style={styles.contactMarkText}>{initials(contact.name)}</Text>
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.title} numberOfLines={1}>{contact.name}</Text>
                    <Text style={styles.muted} numberOfLines={1}>{contact.email ?? contact.phone ?? "No contact details"}</Text>
                  </View>
                </View>
              ))}
            </Card>
          ) : null}
          {!contacts.loading && !contacts.error && contacts.data?.contacts.length === 0 ? (
            <EmptyState title="No contacts yet" message="Add contacts on the web app to track who has what." />
          ) : null}
        </View>
      </Screen>
    </AuthGate>
  )
}

function initials(value: string | null | undefined) {
  if (!value) return "HS"
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("")
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value))
}

const styles = StyleSheet.create({
  accountTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  avatar: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    height: 54,
    width: 54,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "800",
  },
  accountText: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
  },
  actions: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  listCard: {
    gap: 0,
    paddingVertical: 0,
  },
  listRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  rowPills: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  contactMark: {
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  contactMarkText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
  },
  divider: {
    borderBottomColor: colors.edge,
    borderBottomWidth: 1,
  },
})

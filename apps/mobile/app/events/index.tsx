import { useCallback } from "react"
import { Alert, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import type { MobileShelfEvent } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { Button, Card, DangerButton, EmptyState, ErrorState, LoadingState, Pill, Screen } from "../../components/screen"
import { deleteEvent, getEvents } from "../../lib/api"
import { colors, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function EventsScreen() {
  const router = useRouter()
  const query = useCachedQuery("events", useCallback(() => getEvents(), []))

  async function remove(id: string) {
    await deleteEvent(id)
    await query.reload()
  }

  return (
    <AuthGate>
      <Screen
        title="Events"
        subtitle="Plan book clubs, movie nights, and game nights around your shelf."
        back={{ label: "More", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)/more") }}
        action={{ label: "Create", onPress: () => router.push("/events/new") }}
      >
        {query.loading ? <LoadingState /> : null}
        {query.error ? <ErrorState message={query.error} onRetry={() => void query.reload()} /> : null}
        {!query.loading && !query.error && query.data?.events.length === 0 ? (
          <EmptyState
            title="No events yet"
            message="Create a recurring book club or a one-off movie or game night."
            action={<Button label="Create Event" onPress={() => router.push("/events/new")} />}
          />
        ) : null}
        {query.data?.events.map((event) => (
          <EventCard key={event.id} event={event} onDelete={() => Alert.alert("Delete event?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => void remove(event.id) },
          ])} />
        ))}
      </Screen>
    </AuthGate>
  )
}

function EventCard({ event, onDelete }: { event: MobileShelfEvent; onDelete: () => void }) {
  return (
    <Card>
      <View style={styles.pills}>
        <Pill label={event.type.replace("_", " ")} tone="accent" />
        <Pill label={event.recurrence === "none" ? "One-time" : event.recurrence} />
      </View>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.muted}>{formatDate(event.startsAt)}</Text>
      {event.items.length ? (
        <View style={styles.items}>{event.items.map((item) => <Pill key={item.id} label={item.title} />)}</View>
      ) : null}
      {event.notes ? <Text style={styles.notes}>{event.notes}</Text> : null}
      <DangerButton label="Delete Event" fullWidth onPress={onDelete} />
    </Card>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

const styles = StyleSheet.create({
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  title: { color: colors.ink, fontSize: 18, fontWeight: "800", lineHeight: 23 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  items: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  notes: { color: colors.muted, fontSize: 14, lineHeight: 20 },
})

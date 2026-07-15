import { useCallback, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import type { MobileContactRequest } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { Button, Card, EmptyState, ErrorState, LoadingState, Screen, SecondaryButton, SectionHeader, StatusText } from "../../components/screen"
import { getContactRequests, getContacts, respondToContactRequest } from "../../lib/api"
import { colors, radii, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function ContactsScreen() {
  const router = useRouter()
  const contacts = useCachedQuery("contacts", useCallback(() => getContacts(), []))
  const requests = useCachedQuery("contact-requests", useCallback(() => getContactRequests(), []))
  const [status, setStatus] = useState<string | null>(null)

  async function respond(action: "accept" | "decline", requestId: string) {
    setStatus(null)
    try {
      await respondToContactRequest(action, requestId)
      await Promise.all([contacts.reload(), requests.reload()])
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to update request")
    }
  }

  return (
    <AuthGate>
      <Screen
        title="Contacts"
        subtitle={contacts.data ? `${contacts.data.contacts.length} contacts` : "People connected to your shelf."}
        back={{ label: "More", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)/more") }}
        action={{ label: "Add", onPress: () => router.push("/contacts/new") }}
      >
        {status ? <StatusText tone="danger">{status}</StatusText> : null}
        {requests.data?.requests.length ? (
          <View style={styles.section}>
            <SectionHeader title="Contact requests" />
            {requests.data.requests.map((request) => (
              <RequestCard key={request.id} request={request} onRespond={respond} />
            ))}
          </View>
        ) : null}
        {contacts.loading || requests.loading ? <LoadingState /> : null}
        {contacts.error ? <ErrorState message={contacts.error} onRetry={() => void contacts.reload()} /> : null}
        {requests.error ? <ErrorState message={requests.error} onRetry={() => void requests.reload()} /> : null}
        {!contacts.loading && !contacts.error && contacts.data?.contacts.length === 0 ? (
          <EmptyState
            title="No contacts yet"
            message="Add someone manually or connect with another HearthShelf user."
            action={<Button label="Add Contact" onPress={() => router.push("/contacts/new")} />}
          />
        ) : null}
        {contacts.data?.contacts.map((contact) => (
          <Pressable
            accessibilityRole="button"
            key={contact.id}
            onPress={() => router.push({ pathname: "/contacts/[id]", params: { id: contact.id } })}
            style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
          >
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(contact.name)}</Text></View>
            <View style={styles.contactText}>
              <Text style={styles.name}>{contact.name}</Text>
              <Text style={styles.muted} numberOfLines={1}>
                {contact.linkedUserId ? "Connected HearthShelf user" : contact.email ?? contact.phone ?? "No contact details"}
              </Text>
            </View>
          </Pressable>
        ))}
      </Screen>
    </AuthGate>
  )
}

function RequestCard({
  request,
  onRespond,
}: {
  request: MobileContactRequest
  onRespond: (action: "accept" | "decline", requestId: string) => Promise<void>
}) {
  return (
    <Card>
      <View style={styles.requestTop}>
        {request.requester.image ? (
          <Image source={{ uri: request.requester.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials(request.requester.name)}</Text></View>
        )}
        <View style={styles.contactText}>
          <Text style={styles.name}>{request.requester.name}</Text>
          <Text style={styles.muted}>Wants to connect with you.</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <SecondaryButton label="Decline" onPress={() => void onRespond("decline", request.id)} />
        <Button label="Accept" onPress={() => void onRespond("accept", request.id)} />
      </View>
    </Card>
  )
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("")
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  contactCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.surfaceRaised },
  avatar: { alignItems: "center", backgroundColor: colors.accentSoft, borderRadius: radii.pill, height: 44, justifyContent: "center", width: 44 },
  avatarText: { color: colors.accent, fontSize: 14, fontWeight: "800" },
  contactText: { flex: 1, minWidth: 0 },
  name: { color: colors.ink, fontSize: 16, fontWeight: "800", lineHeight: 21 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  requestTop: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end" },
})

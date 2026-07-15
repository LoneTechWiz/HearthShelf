import { useCallback, useState } from "react"
import { Alert, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { AuthGate } from "../../components/auth-gate"
import { ContactForm } from "../../components/contact-form"
import { Card, DangerButton, ErrorState, LoadingState, Screen, StatusText } from "../../components/screen"
import { deleteContact, getContact } from "../../lib/api"
import { colors, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function ContactDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [editing, setEditing] = useState(false)
  const query = useCachedQuery(`contact:${id}`, useCallback(() => getContact(id), [id]))
  const contact = query.data?.contact

  async function remove() {
    try {
      await deleteContact(id)
      router.replace("/contacts")
    } catch (err) {
      Alert.alert("Unable to delete contact", err instanceof Error ? err.message : "Please try again.")
    }
  }

  return (
    <AuthGate>
      <Screen
        title={contact?.name ?? "Contact"}
        subtitle={contact?.linkedUserId ? "Connected HearthShelf user" : undefined}
        back={{ label: "Contacts", onPress: () => router.canGoBack() ? router.back() : router.replace("/contacts") }}
        action={contact && !contact.linkedUserId ? { label: editing ? "Cancel" : "Edit", onPress: () => setEditing((value) => !value) } : undefined}
      >
        {query.loading ? <LoadingState /> : null}
        {query.error ? <ErrorState message={query.error} onRetry={() => void query.reload()} /> : null}
        {contact && editing ? (
          <ContactForm contact={contact} onSaved={() => { setEditing(false); void query.reload() }} />
        ) : null}
        {contact && !editing ? (
          <Card>
            {contact.email && !contact.linkedUserId ? <Detail label="Email" value={contact.email} /> : null}
            {contact.phone ? <Detail label="Phone" value={contact.phone} /> : null}
            {contact.linkedUserId ? <StatusText>Contact details are managed by this user’s profile.</StatusText> : null}
            {!contact.email && !contact.phone && !contact.linkedUserId ? <StatusText>No contact details.</StatusText> : null}
            {!contact.linkedUserId ? (
              <DangerButton label="Delete Contact" fullWidth onPress={() => Alert.alert("Delete contact?", "This cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => void remove() },
              ])} />
            ) : null}
          </Card>
        ) : null}
      </Screen>
    </AuthGate>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>
}

const styles = StyleSheet.create({
  detail: { gap: spacing.xs },
  label: { color: colors.faint, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  value: { color: colors.ink, fontSize: 16, lineHeight: 22 },
})

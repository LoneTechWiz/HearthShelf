import { useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import type { MobileUserSearchResult } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { ContactForm } from "../../components/contact-form"
import { FormField } from "../../components/form-field"
import { Button, Card, Screen, SectionHeader, StatusText } from "../../components/screen"
import { getContactRequests, requestUserContact } from "../../lib/api"
import { colors, radii, spacing } from "../../lib/theme"

export default function NewContactScreen() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MobileUserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function search() {
    if (query.trim().length < 2) return
    setSearching(true)
    setStatus(null)
    try {
      const data = await getContactRequests(query)
      setResults(data.users)
      if (!data.users.length) setStatus(`No users found for “${query.trim()}”.`)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Search failed")
    } finally {
      setSearching(false)
    }
  }

  async function sendRequest(userId: string) {
    setStatus(null)
    try {
      await requestUserContact(userId)
      setResults((current) => current.filter((user) => user.id !== userId))
      setStatus("Contact request sent.")
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to send request")
    }
  }

  return (
    <AuthGate>
      <Screen
        title="Add a Contact"
        subtitle="Connect with a user or add someone manually."
        back={{ label: "Contacts", onPress: () => router.canGoBack() ? router.back() : router.replace("/contacts") }}
      >
        <View style={styles.section}>
          <SectionHeader title="Find a user" subtitle="Search by name. Email addresses stay private." />
          <Card>
            <FormField label="Name" placeholder="Search by name" value={query} onChangeText={setQuery} autoCapitalize="words" />
            <Button disabled={searching || query.trim().length < 2} fullWidth label={searching ? "Searching..." : "Search"} onPress={() => void search()} />
            {status ? <StatusText>{status}</StatusText> : null}
            {results.map((user) => (
              <Pressable
                accessibilityLabel={`Send contact request to ${user.name}`}
                accessibilityRole="button"
                key={user.id}
                style={styles.userRow}
                onPress={() => void sendRequest(user.id)}
              >
                {user.image ? <Image source={{ uri: user.image }} style={styles.avatar} /> : <View style={styles.avatar} />}
                <View style={styles.userText}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={styles.muted}>HearthShelf user</Text>
                </View>
                <Text style={styles.send}>Send request</Text>
              </Pressable>
            ))}
          </Card>
        </View>
        <View style={styles.section}>
          <SectionHeader title="Add manually" />
          <ContactForm onSaved={() => router.replace("/contacts")} />
        </View>
      </Screen>
    </AuthGate>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  userRow: { alignItems: "center", borderTopColor: colors.edge, borderTopWidth: 1, flexDirection: "row", gap: spacing.md, paddingTop: spacing.md },
  avatar: { backgroundColor: colors.surfaceRaised, borderRadius: radii.pill, height: 40, width: 40 },
  userText: { flex: 1, minWidth: 0 },
  name: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
  send: { color: colors.accent, fontSize: 13, fontWeight: "800" },
})

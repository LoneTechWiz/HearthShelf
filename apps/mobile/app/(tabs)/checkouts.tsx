import { useCallback, useState } from "react"
import { Image, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import type { MobileCheckout } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { Card, EmptyState, ErrorState, LoadingState, Pill, Screen, SecondaryButton, SectionHeader } from "../../components/screen"
import { getCheckouts, returnCheckout } from "../../lib/api"
import { colors, radii, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function CheckoutsScreen() {
  const router = useRouter()
  const load = useCallback(() => getCheckouts(), [])
  const { data, loading, error, reload } = useCachedQuery("checkouts", load)
  const [returningId, setReturningId] = useState<string | null>(null)

  async function markReturned(checkoutId: string) {
    setReturningId(checkoutId)
    try {
      await returnCheckout(checkoutId)
      await reload()
    } finally {
      setReturningId(null)
    }
  }

  return (
    <AuthGate>
      <Screen
        title="Active Checkouts"
        subtitle="Items currently away from the shelf."
        action={{ label: "Check Out", onPress: () => router.push("/checkouts/new") }}
      >
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {data?.active.length ? (
          <View style={styles.section}>
            {data.active.map((checkout) => (
              <CheckoutCard
                key={checkout.id}
                checkout={checkout}
                returning={returningId === checkout.id}
                onReturn={() => void markReturned(checkout.id)}
              />
            ))}
          </View>
        ) : null}
        {!loading && !error && data?.active.length === 0 ? (
          <EmptyState
            title="Nothing checked out"
            message="All your items are home on the shelf."
            action={<SecondaryButton label="Check Out an Item" onPress={() => router.push("/checkouts/new")} />}
          />
        ) : null}
        {data?.history.length ? (
          <View style={styles.section}>
            <SectionHeader title="History" subtitle="Recently returned items." />
            <Card style={styles.historyCard}>
              {data.history.map((checkout, index) => (
                <View
                  key={checkout.id}
                  style={[styles.historyRow, index < data.history.length - 1 && styles.divider]}
                >
                  <View style={styles.historyText}>
                    <Text style={styles.title} numberOfLines={1}>{checkout.item.title}</Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      {checkout.contact ? checkout.contact.name : "Yourself"} · {formatDate(checkout.checkedOutAt)} to {formatDate(checkout.returnedAt)}
                    </Text>
                  </View>
                  <Pill label={checkout.item.type} />
                </View>
              ))}
            </Card>
          </View>
        ) : null}
      </Screen>
    </AuthGate>
  )
}

function CheckoutCard({
  checkout,
  returning,
  onReturn,
}: {
  checkout: MobileCheckout
  returning: boolean
  onReturn: () => void
}) {
  const dueDate = checkout.dueDate ? new Date(checkout.dueDate) : null
  const overdue = dueDate ? dueDate < new Date() : false

  return (
    <Card>
      <View style={styles.cardTop}>
        <View style={styles.coverFrame}>
          {checkout.item.coverUrl ? (
            <Image source={{ uri: checkout.item.coverUrl }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>{checkout.item.type.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardText}>
          <View style={styles.pillRow}>
            <Pill label={checkout.item.type} />
            {dueDate ? (
              <Pill
                label={`Due ${formatDate(checkout.dueDate)}`}
                tone={overdue ? "danger" : "warning"}
              />
            ) : null}
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{checkout.item.title}</Text>
          <Text style={styles.muted} numberOfLines={2}>
            {checkout.contact ? `Checked out to ${checkout.contact.name}` : "Checked out to yourself"}
          </Text>
          <Text style={styles.faint}>Since {formatDate(checkout.checkedOutAt)}</Text>
        </View>
      </View>
      {checkout.notes ? <Text style={styles.note}>{checkout.notes}</Text> : null}
      <SecondaryButton
        label={returning ? "Returning..." : "Mark Returned"}
        disabled={returning}
        onPress={onReturn}
        fullWidth
      />
    </Card>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return "now"
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  coverFrame: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.edge,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 76,
    overflow: "hidden",
    width: 56,
  },
  cover: {
    height: "100%",
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    flex: 1,
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "800",
  },
  cardText: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
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
  faint: {
    color: colors.faint,
    fontSize: 12,
    lineHeight: 17,
  },
  note: {
    color: colors.muted,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  historyCard: {
    gap: 0,
    paddingVertical: 0,
  },
  historyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  historyText: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  divider: {
    borderBottomColor: colors.edge,
    borderBottomWidth: 1,
  },
})

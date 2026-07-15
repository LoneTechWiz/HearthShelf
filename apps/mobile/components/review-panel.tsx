import { useCallback, useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { FormField } from "./form-field"
import { Button, Card, DangerButton, ErrorState, LoadingState, SectionHeader, StatusText } from "./screen"
import { deleteReview, getReview, saveReview } from "../lib/api"
import { colors, spacing } from "../lib/theme"
import { useCachedQuery } from "../lib/use-cached-query"

export function ReviewPanel({ lendableItemId }: { lendableItemId: string }) {
  const query = useCachedQuery(`review:${lendableItemId}`, useCallback(() => getReview(lendableItemId), [lendableItemId]))
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!query.data) return
    setRating(query.data.review?.rating ?? 0)
    setBody(query.data.review?.body ?? "")
  }, [query.data])

  async function submit() {
    if (!rating) return
    setSaving(true)
    setStatus(null)
    try {
      await saveReview(lendableItemId, rating, body)
      await query.reload()
      setStatus("Review saved.")
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to save review")
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setSaving(true)
    setStatus(null)
    try {
      await deleteReview(lendableItemId)
      setRating(0)
      setBody("")
      await query.reload()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to remove review")
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Your review"
        subtitle={query.data?.review ? `Rated ${query.data.review.rating} out of 5.` : "Add a personal rating and notes."}
      />
      {query.loading ? <LoadingState /> : null}
      {query.error ? <ErrorState message={query.error} onRetry={() => void query.reload()} /> : null}
      {!query.loading && !query.error ? (
        <Card>
          <View accessibilityRole="radiogroup" style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                accessibilityLabel={`${value} out of 5`}
                accessibilityRole="radio"
                accessibilityState={{ selected: rating === value }}
                key={value}
                onPress={() => setRating(value)}
              >
                <Text style={[styles.star, value <= rating && styles.starSelected]}>★</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.rating}>{rating ? `${rating} out of 5` : "No rating selected"}</Text>
          <FormField label="Notes" value={body} onChangeText={setBody} multiline placeholder="What did you think?" />
          {status ? <StatusText tone={status === "Review saved." ? "neutral" : "danger"}>{status}</StatusText> : null}
          <Button disabled={saving || !rating} fullWidth label={saving ? "Saving..." : query.data?.review ? "Update Review" : "Save Review"} onPress={() => void submit()} />
          {query.data?.review ? <DangerButton disabled={saving} fullWidth label="Remove Review" onPress={() => void remove()} /> : null}
        </Card>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  stars: { flexDirection: "row", gap: spacing.sm },
  star: { color: colors.faint, fontSize: 36, lineHeight: 40 },
  starSelected: { color: colors.accent },
  rating: { color: colors.muted, fontSize: 13 },
})

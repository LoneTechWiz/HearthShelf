import { useState } from "react"
import type { MobileContact } from "@my-shelf/types"
import { Button, Card, StatusText } from "./screen"
import { FormField } from "./form-field"
import { saveContact } from "../lib/api"

export function ContactForm({ contact, onSaved }: { contact?: MobileContact; onSaved: () => void }) {
  const [name, setName] = useState(contact?.name ?? "")
  const [email, setEmail] = useState(contact?.email ?? "")
  const [phone, setPhone] = useState(contact?.phone ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await saveContact({ name, email, phone }, contact?.id)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save contact")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      {error ? <StatusText tone="danger">{error}</StatusText> : null}
      <FormField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
      <FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <FormField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Button
        disabled={saving || !name.trim()}
        fullWidth
        label={saving ? "Saving..." : contact ? "Save Changes" : "Add Contact"}
        onPress={() => void submit()}
      />
    </Card>
  )
}

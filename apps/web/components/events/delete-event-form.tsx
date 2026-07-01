"use client"

import { deleteEvent } from "@/lib/actions/events"
import { btnSecondarySm } from "@/components/ui/classes"

export function DeleteEventForm({ eventId }: { eventId: string }) {
  const handleDelete = async (formData: FormData) => {
    if (!confirm("Delete this event?")) return
    await deleteEvent(null, formData)
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="id" value={eventId} />
      <button type="submit" className={btnSecondarySm}>
        Delete
      </button>
    </form>
  )
}

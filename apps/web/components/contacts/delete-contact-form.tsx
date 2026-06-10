"use client"

import { deleteContact } from "@/lib/actions/contacts"
import { btnDanger } from "@/components/ui/classes"

interface DeleteContactFormProps {
  contactId: string
}

export function DeleteContactForm({ contactId }: DeleteContactFormProps) {
  const handleDelete = async (formData: FormData) => {
    if (!confirm("Delete this contact? This cannot be undone.")) {
      return
    }
    await deleteContact(null, formData)
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="id" value={contactId} />
      <button type="submit" className={btnDanger}>
        Delete
      </button>
    </form>
  )
}

"use client"

import { deleteContact } from "@/lib/actions/contacts"

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
      <button
        type="submit"
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
      >
        Delete
      </button>
    </form>
  )
}

"use client"

import { useActionState } from "react"
import type { BookRow } from "@/lib/queries/books"
import type { ContactRow } from "@/lib/queries/contacts"

type ActionState = { error: string } | null
type CheckoutFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>

interface CheckoutFormProps {
  action: CheckoutFormAction
  books: Pick<BookRow, "id" | "title">[]
  contacts: Pick<ContactRow, "id" | "name">[]
}

export function CheckoutForm({ action, books, contacts }: CheckoutFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="bookId">
          Book <span className="text-red-500">*</span>
        </label>
        <select
          id="bookId"
          name="bookId"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <option value="">Select a book…</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="borrower">
          Borrower <span className="text-red-500">*</span>
        </label>
        <select
          id="borrower"
          name="borrower"
          required
          defaultValue="self"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <option value="self">Myself</option>
          {contacts.map((c) => (
            <option key={c.id} value={`contact:${c.id}`}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="dueDate">
          Due date
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Check Out"}
      </button>
    </form>
  )
}

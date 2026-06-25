"use client"

import { useActionState } from "react"
import { ItemPicker } from "./item-picker"
import type { ContactRow } from "@/lib/queries/contacts"
import { btnPrimary, inputClass, labelClass } from "@/components/ui/classes"

type ActionState = { error: string } | null
type CheckoutFormAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>

interface LendableItem {
  lendableItemId: string
  title: string
  subtitle?: string | null
}

interface CheckoutFormProps {
  action: CheckoutFormAction
  books: LendableItem[]
  movies: LendableItem[]
  games: LendableItem[]
  contacts: Pick<ContactRow, "id" | "name">[]
  defaultLendableItemId?: string
  defaultType?: "book" | "movie" | "game"
}

export function CheckoutForm({ action, books, movies, games, contacts, defaultLendableItemId, defaultType }: CheckoutFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className={labelClass}>
          Item <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <ItemPicker
          books={books}
          movies={movies}
          games={games}
          defaultLendableItemId={defaultLendableItemId}
          defaultType={defaultType}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="borrower">
          Borrower <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <select id="borrower" name="borrower" required defaultValue="self" className={inputClass}>
          <option value="self">Myself</option>
          {contacts.map((c) => (
            <option key={c.id} value={`contact:${c.id}`}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="dueDate">Due date</label>
        <input id="dueDate" name="dueDate" type="date" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
      </div>

      <button type="submit" disabled={isPending} className={`self-start ${btnPrimary}`}>
        {isPending ? "Saving…" : "Check Out"}
      </button>
    </form>
  )
}

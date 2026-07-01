"use client"

import { useActionState } from "react"
import { EventItemPicker } from "@/components/events/event-item-picker"
import { btnPrimary, inputClass, labelClass } from "@/components/ui/classes"

type ActionState = { error: string } | null
type EventFormAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>

type LendableItem = {
  lendableItemId: string
  title: string
  subtitle?: string | null
}

export function EventForm({
  action,
  books,
  movies,
  games,
}: {
  action: EventFormAction
  books: LendableItem[]
  movies: LendableItem[]
  games: LendableItem[]
}) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="title">
          Event name <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input id="title" name="title" required className={inputClass} placeholder="July book club" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="type">
            Type <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <select id="type" name="type" required defaultValue="book_club" className={inputClass}>
            <option value="book_club">Book club</option>
            <option value="movie_night">Movie night</option>
            <option value="game_night">Game night</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="recurrence">Repeats</label>
          <select id="recurrence" name="recurrence" defaultValue="none" className={inputClass}>
            <option value="none">Does not repeat</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="startsAt">
          Date and time <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input id="startsAt" name="startsAt" type="datetime-local" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Shelf items</label>
        <EventItemPicker books={books} movies={movies} games={games} />
        <p className="text-xs text-ink-muted">
          Optional. Assign one or more books, movies, or games this event is about.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className={inputClass}
          placeholder="Location, chapters to read, snacks to bring..."
        />
      </div>

      <button type="submit" disabled={isPending} className={`self-start ${btnPrimary}`}>
        {isPending ? "Saving..." : "Create Event"}
      </button>
    </form>
  )
}

"use client"

import { useActionState } from "react"

type ActionState = { error: string } | null
type BookFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>

interface BookFormProps {
  action: BookFormAction
  defaultValues?: {
    id?: string
    title?: string
    authors?: string | null
    isbn?: string | null
    description?: string | null
    coverUrl?: string | null
  }
  submitLabel?: string
}

export function BookForm({ action, defaultValues, submitLabel = "Save" }: BookFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="authors">
          Author(s)
        </label>
        <input
          id="authors"
          name="authors"
          defaultValue={defaultValues?.authors ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="isbn">
          ISBN
        </label>
        <input
          id="isbn"
          name="isbn"
          defaultValue={defaultValues?.isbn ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="coverUrl">
          Cover image URL
        </label>
        <input
          id="coverUrl"
          name="coverUrl"
          type="url"
          defaultValue={defaultValues?.coverUrl ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  )
}

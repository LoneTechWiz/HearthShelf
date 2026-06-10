"use client"

import { useActionState } from "react"
import { btnPrimary, inputClass, labelClass } from "@/components/ui/classes"

type ActionState = { error: string } | null
type ContactFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>

interface ContactFormProps {
  action: ContactFormAction
  defaultValues?: {
    id?: string
    name?: string
    email?: string | null
    phone?: string | null
  }
  submitLabel?: string
}

export function ContactForm({
  action,
  defaultValues,
  submitLabel = "Save",
}: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="name">
          Name <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone ?? ""}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`self-start ${btnPrimary}`}
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  )
}

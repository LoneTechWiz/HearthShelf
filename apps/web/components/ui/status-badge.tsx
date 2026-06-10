export type Status = "available" | "checked-out" | "overdue"

const styles: Record<Status, string> = {
  available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  "checked-out": "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
}

const dots: Record<Status, string> = {
  available: "bg-emerald-500",
  "checked-out": "bg-amber-500",
  overdue: "bg-red-500",
}

const labels: Record<Status, string> = {
  available: "Available",
  "checked-out": "Checked out",
  overdue: "Overdue",
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {labels[status]}
    </span>
  )
}

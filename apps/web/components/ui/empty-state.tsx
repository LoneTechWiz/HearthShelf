export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-edge bg-surface px-6 py-16 text-center">
      <span className="text-ink-faint [&>svg]:h-10 [&>svg]:w-10">{icon}</span>
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      {action && <div className="mt-2 flex items-center gap-2">{action}</div>}
    </div>
  )
}

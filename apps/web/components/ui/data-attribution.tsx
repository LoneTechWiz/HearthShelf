type DataAttributionProps = {
  label: string
  href: string
}

export function DataAttribution({ label, href }: DataAttributionProps) {
  return (
    <p className="mt-4 text-xs text-ink-faint">
      Metadata from{" "}
      <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-muted">
        {label}
      </a>
      .
    </p>
  )
}

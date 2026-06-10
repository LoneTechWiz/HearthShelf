"use client"

import { useEffect, useRef, useState } from "react"
import { signOutAction } from "@/lib/actions/auth"
import { ThemeToggle } from "@/components/theme-toggle"

export type NavUser = { name: string | null; email: string | null; image: string | null }

function Avatar({ user, className }: { user: NavUser; className: string }) {
  if (user.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.image} alt="" className={`${className} rounded-full object-cover`} />
  }
  return (
    <span
      className={`${className} flex items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent`}
    >
      {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
    </span>
  )
}

export function UserMenu({ user, variant }: { user: NavUser; variant: "sidebar" | "tab" }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const menu = (
    <div
      role="menu"
      className={`absolute z-50 w-56 rounded-xl border border-edge bg-surface p-1.5 shadow-lg ${
        variant === "sidebar" ? "bottom-full left-0 mb-2" : "bottom-full right-2 mb-3"
      }`}
    >
      <div className="border-b border-edge px-3 pb-2 pt-1.5">
        <p className="truncate text-sm font-medium text-ink">{user.name ?? "Signed in"}</p>
        {user.email && <p className="truncate text-xs text-ink-muted">{user.email}</p>}
      </div>
      <div className="pt-1">
        <ThemeToggle variant="sidebar" />
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-ink-muted hover:bg-surface-raised hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )

  if (variant === "sidebar") {
    return (
      <div ref={ref} className="relative">
        {open && menu}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-surface-raised"
        >
          <Avatar user={user} className="h-7 w-7 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">{user.name ?? "Account"}</span>
            {user.email && <span className="block truncate text-xs text-ink-muted">{user.email}</span>}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex flex-1">
      {open && menu}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-ink-faint"
      >
        <Avatar user={user} className="h-6 w-6" />
        Account
      </button>
    </div>
  )
}

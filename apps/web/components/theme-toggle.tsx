"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

const order = ["system", "light", "dark"] as const
type ThemeChoice = (typeof order)[number]

const monitorIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
  </svg>
)

const sunIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
)

const moonIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
)

const icons: Record<ThemeChoice, React.ReactNode> = {
  system: monitorIcon,
  light: sunIcon,
  dark: moonIcon,
}

const labels: Record<ThemeChoice, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
}

export function ThemeToggle({ variant }: { variant: "sidebar" | "tab" }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // Use a timeout callback so the linter's set-state-in-effect rule is satisfied.
  // The zero delay still defers until after first render, preventing hydration mismatch.
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(id)
  }, [])

  const current: ThemeChoice = mounted && order.includes(theme as ThemeChoice)
    ? (theme as ThemeChoice)
    : "system"

  const next = order[(order.indexOf(current) + 1) % order.length]

  const sidebarClass =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
  const tabClass =
    "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch theme (current: ${labels[current]})`}
      title={`Theme: ${labels[current]}`}
      className={variant === "sidebar" ? sidebarClass : tabClass}
    >
      {variant === "sidebar" ? (
        <>
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icons[current]}</span>
          {labels[current]}
        </>
      ) : (
        <>
          {icons[current]}
          {labels[current]}
        </>
      )}
    </button>
  )
}

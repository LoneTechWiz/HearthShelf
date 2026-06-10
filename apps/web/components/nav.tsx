"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wordmark } from "@/components/brand"
import { UserMenu, type NavUser } from "@/components/user-menu"

const links = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
      </svg>
    ),
  },
  {
    href: "/books",
    label: "Books",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    href: "/contacts",
    label: "Contacts",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    href: "/checkouts",
    label: "Checkouts",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
]

export function Nav({ user }: { user: NavUser }) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Library"
        className="nav-desktop w-52 flex-col gap-1 border-r border-edge bg-surface px-3 py-6"
      >
        <div className="mb-6 px-2">
          <Wordmark />
        </div>
        {links.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-soft text-accent before:absolute before:-left-3 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent"
                  : "text-ink-muted hover:bg-surface-raised hover:text-ink"
              }`}
            >
              {label}
            </Link>
          )
        })}
        <div className="mt-auto border-t border-edge pt-2">
          <UserMenu user={user} variant="sidebar" />
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Library tabs"
        className="nav-mobile fixed bottom-0 left-0 right-0 z-50 h-14 border-t border-edge bg-surface"
      >
        {links.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                isActive ? "text-accent" : "text-ink-faint"
              }`}
            >
              {icon}
              {label}
            </Link>
          )
        })}
        <UserMenu user={user} variant="tab" />
      </nav>
    </>
  )
}

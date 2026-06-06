"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOutAction } from "@/lib/actions/auth"

const links = [
  { href: "/books", label: "Books" },
  { href: "/contacts", label: "Contacts" },
  { href: "/checkouts", label: "Checkouts" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex w-48 flex-col gap-1 border-r border-zinc-200 bg-white px-3 py-6">
      <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        Library
      </p>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname.startsWith(href)
              ? "bg-zinc-100 text-zinc-900"
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
          }`}
        >
          {label}
        </Link>
      ))}
      <form action={signOutAction} className="mt-auto">
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
        >
          Sign out
        </button>
      </form>
    </nav>
  )
}

"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function FlashToast() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const flash = searchParams.get("flash")
  // Guards against Strict Mode double-firing in dev; resets once the param
  // is stripped so a later flash with the same message still toasts.
  const lastFired = useRef<string | null>(null)

  useEffect(() => {
    if (!flash) {
      lastFired.current = null
      return
    }
    if (lastFired.current === flash) return
    lastFired.current = flash
    toast.success(flash)
    const rest = new URLSearchParams(searchParams)
    rest.delete("flash")
    const query = rest.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [flash, pathname, router, searchParams])

  return null
}

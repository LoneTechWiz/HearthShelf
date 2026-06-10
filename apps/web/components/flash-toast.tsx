"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function FlashToast() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const flash = searchParams.get("flash")

  useEffect(() => {
    if (!flash) return
    toast.success(flash)
    const rest = new URLSearchParams(searchParams)
    rest.delete("flash")
    const query = rest.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [flash, pathname, router, searchParams])

  return null
}

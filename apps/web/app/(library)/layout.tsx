import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Nav } from "@/components/nav"
import { Toaster } from "sonner"
import { FlashToast } from "@/components/flash-toast"
import { getNotificationsForUser } from "@/lib/notifications"

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/")
  const notificationCount = session.user?.id
    ? (await getNotificationsForUser(session.user.id)).length
    : 0

  return (
    <div className="flex min-h-screen">
      <Nav
        notificationCount={notificationCount}
        user={{
          name: session.user?.name ?? null,
          email: session.user?.email ?? null,
          image: session.user?.image ?? null,
        }}
      />
      <div className="flex-1 overflow-y-auto bg-canvas p-4 pb-20 md:p-8">{children}</div>
      <Toaster position="top-right" toastOptions={{ className: "!bg-surface !text-ink !border-edge" }} />
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </div>
  )
}

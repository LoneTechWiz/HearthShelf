import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Nav } from "@/components/nav"

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="flex min-h-screen">
      <Nav />
      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-4 pb-20 md:p-8">{children}</div>
    </div>
  )
}

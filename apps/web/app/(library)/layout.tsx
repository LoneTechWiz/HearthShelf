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
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}

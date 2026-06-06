import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/")

  return <div className="min-h-screen bg-zinc-50">{children}</div>
}

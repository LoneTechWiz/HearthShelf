import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  if (session) redirect("/books")

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 dark:bg-zinc-950">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Personal Library</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Track your books and who has them.</p>
      <div className="flex flex-col gap-3">
        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/books" })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Sign in with GitHub
          </button>
        </form>
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/books" })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  )
}

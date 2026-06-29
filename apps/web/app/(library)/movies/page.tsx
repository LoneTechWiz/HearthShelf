import { redirect } from "next/navigation"

export default function MoviesPage() {
  redirect("/shelf?type=movies")
}

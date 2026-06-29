import { redirect } from "next/navigation"

export default function BooksPage() {
  redirect("/shelf?type=books")
}

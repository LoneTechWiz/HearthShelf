"use client"

import { useActionState, useState, useEffect } from "react"
import { searchByTitle, lookupByIsbn } from "@/lib/open-library"
import type { BookSuggestion } from "@/lib/open-library"
import { normalizeIsbn } from "@/lib/isbn"
import { BookSearchDropdown } from "./book-search-dropdown"
import { BarcodeScanner } from "./barcode-scanner"

type ActionState = { error: string } | null
type BookFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>

interface BookFormProps {
  action: BookFormAction
  defaultValues?: {
    id?: string
    title?: string
    authors?: string | null
    isbn?: string | null
    description?: string | null
    coverUrl?: string | null
  }
  submitLabel?: string
}

export function BookForm({ action, defaultValues, submitLabel = "Save" }: BookFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  const [title, setTitle] = useState(defaultValues?.title ?? "")
  const [searchQuery, setSearchQuery] = useState(defaultValues?.title ?? "")
  const [authors, setAuthors] = useState(defaultValues?.authors ?? "")
  const [isbn, setIsbn] = useState(defaultValues?.isbn ?? "")
  const [description, setDescription] = useState(defaultValues?.description ?? "")
  const [coverUrl, setCoverUrl] = useState(defaultValues?.coverUrl ?? "")

  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      setSearchError(null)
      try {
        const results = await searchByTitle(searchQuery)
        setSuggestions(results)
        setShowDropdown(true)
      } catch {
        setSearchError("Search failed")
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  function handleSelect(suggestion: BookSuggestion) {
    setTitle(suggestion.title)
    setSearchQuery("")
    setAuthors(suggestion.authors)
    setIsbn(suggestion.isbn ?? "")
    setCoverUrl(suggestion.coverUrl ?? "")
    setDescription(suggestion.description ?? "")
    setShowDropdown(false)
    setSuggestions([])
  }

  async function runLookup(code: string) {
    setIsLookingUp(true)
    setLookupError(null)
    try {
      const result = await lookupByIsbn(code)
      if (!result) {
        setLookupError("No book found for this ISBN")
        return
      }
      setTitle(result.title)
      setAuthors(result.authors)
      setCoverUrl(result.coverUrl ?? "")
      setDescription(result.description ?? "")
    } catch {
      setLookupError("Lookup failed")
    } finally {
      setIsLookingUp(false)
    }
  }

  function handleIsbnLookup() {
    if (!isbn) return
    runLookup(isbn)
  }

  function handleScanned(code: string) {
    setShowScanner(false)
    const normalized = normalizeIsbn(code)
    if (!normalized) {
      setLookupError("Scanned code is not a valid ISBN")
      return
    }
    setIsbn(normalized)
    runLookup(normalized)
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <div className="relative flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSearchQuery(e.target.value) }}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-400"
        />
        {searchError && (
          <p className="text-xs text-red-600">{searchError}</p>
        )}
        {(showDropdown || isSearching) && (
          <BookSearchDropdown
            suggestions={suggestions}
            isSearching={isSearching}
            onSelect={handleSelect}
            onClose={() => setShowDropdown(false)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="authors">
          Author(s)
        </label>
        <input
          id="authors"
          name="authors"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="isbn">
          ISBN
        </label>
        <div className="flex gap-2">
          <input
            id="isbn"
            name="isbn"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-400"
          />
          <button
            type="button"
            onClick={handleIsbnLookup}
            disabled={isLookingUp || !isbn}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-950"
          >
            {isLookingUp ? "Looking up…" : "Lookup"}
          </button>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-950"
          >
            Scan
          </button>
        </div>
        {lookupError && (
          <p className="text-xs text-red-600">{lookupError}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="coverUrl">
          Cover image URL
        </label>
        <input
          id="coverUrl"
          name="coverUrl"
          type="url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-400"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
      {showScanner && (
        <BarcodeScanner
          onDetected={handleScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </form>
  )
}

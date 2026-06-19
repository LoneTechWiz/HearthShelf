"use client"

import { useActionState, useState, useEffect } from "react"
import { searchMoviesByTitle, getMovieByImdbId } from "@/lib/omdb"
import type { MovieSuggestion } from "@/lib/omdb"
import { btnPrimary, inputClass, labelClass } from "@/components/ui/classes"

type ActionState = { error: string } | null
type MovieFormAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>

interface MovieFormProps {
  action: MovieFormAction
  defaultValues?: {
    id?: string
    title?: string
    director?: string | null
    year?: number | null
    posterUrl?: string | null
    format?: string | null
    genre?: string | null
    runtime?: number | null
    description?: string | null
  }
  submitLabel?: string
}

const FORMAT_OPTIONS = ["", "Blu-ray", "DVD", "Digital"]

export function MovieForm({ action, defaultValues, submitLabel = "Save" }: MovieFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  const [title, setTitle] = useState(defaultValues?.title ?? "")
  const [searchQuery, setSearchQuery] = useState(defaultValues?.title ?? "")
  const [director, setDirector] = useState(defaultValues?.director ?? "")
  const [year, setYear] = useState(String(defaultValues?.year ?? ""))
  const [posterUrl, setPosterUrl] = useState(defaultValues?.posterUrl ?? "")
  const [format, setFormat] = useState(defaultValues?.format ?? "")
  const [genre, setGenre] = useState(defaultValues?.genre ?? "")
  const [runtime, setRuntime] = useState(String(defaultValues?.runtime ?? ""))
  const [description, setDescription] = useState(defaultValues?.description ?? "")

  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); setShowDropdown(false); return }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      setSearchError(null)
      try {
        const results = await searchMoviesByTitle(searchQuery)
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

  async function handleSelect(suggestion: MovieSuggestion) {
    setTitle(suggestion.title)
    setSearchQuery("")
    setShowDropdown(false)
    setSuggestions([])
    setPosterUrl(suggestion.posterUrl ?? "")
    setYear(String(suggestion.year ?? ""))
    setIsLookingUp(true)
    try {
      const detail = await getMovieByImdbId(suggestion.imdbId)
      if (detail) {
        setDirector(detail.director ?? "")
        setGenre(detail.genre ?? "")
        setRuntime(String(detail.runtime ?? ""))
        setDescription(detail.description ?? "")
        setPosterUrl(detail.posterUrl ?? suggestion.posterUrl ?? "")
      }
    } finally {
      setIsLookingUp(false)
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      <div className="relative flex flex-col gap-1">
        <label className={labelClass} htmlFor="title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSearchQuery(e.target.value) }}
          className={inputClass}
        />
        {searchError && <p className="text-xs text-red-600">{searchError}</p>}
        {(showDropdown || isSearching) && suggestions.length > 0 && (
          <ul className="absolute top-full z-10 mt-1 w-full rounded-lg border border-edge bg-surface shadow-lg">
            {isSearching && <li className="px-3 py-2 text-sm text-ink-muted">Searching…</li>}
            {suggestions.map((s) => (
              <li key={s.imdbId}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface-raised"
                >
                  <span className="font-medium">{s.title}</span>
                  {s.year && <span className="ml-1 text-ink-muted">({s.year})</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="director">Director</label>
        <input id="director" name="director" value={director}
          onChange={(e) => setDirector(e.target.value)} className={inputClass}
          disabled={isLookingUp} />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label className={labelClass} htmlFor="year">Year</label>
          <input id="year" name="year" type="number" value={year}
            onChange={(e) => setYear(e.target.value)} className={inputClass}
            disabled={isLookingUp} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className={labelClass} htmlFor="runtime">Runtime (min)</label>
          <input id="runtime" name="runtime" type="number" value={runtime}
            onChange={(e) => setRuntime(e.target.value)} className={inputClass}
            disabled={isLookingUp} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="format">Format</label>
        <select id="format" name="format" value={format}
          onChange={(e) => setFormat(e.target.value)}
          className={inputClass}>
          {FORMAT_OPTIONS.map((f) => (
            <option key={f} value={f}>{f || "— select —"}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="genre">Genre</label>
        <input id="genre" name="genre" value={genre}
          onChange={(e) => setGenre(e.target.value)} className={inputClass}
          disabled={isLookingUp} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} value={description}
          onChange={(e) => setDescription(e.target.value)} className={inputClass}
          disabled={isLookingUp} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="posterUrl">Poster URL</label>
        <input id="posterUrl" name="posterUrl" type="url" value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)} className={inputClass} />
      </div>

      {isLookingUp && (
        <p className="text-sm text-ink-muted">Loading details…</p>
      )}

      <button type="submit" disabled={isPending || isLookingUp} className={`self-start ${btnPrimary}`}>
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  )
}

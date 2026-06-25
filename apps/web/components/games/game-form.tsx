"use client"

import { useActionState, useState, useEffect } from "react"
import { searchGamesByTitle, getGameByBggId } from "@/lib/bgg"
import type { GameSuggestion } from "@/lib/bgg"
import { btnPrimary, inputClass, labelClass } from "@/components/ui/classes"

type ActionState = { error: string } | null
type GameFormAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>

interface GameFormProps {
  action: GameFormAction
  defaultValues?: {
    id?: string
    title?: string
    coverUrl?: string | null
    minPlayers?: number | null
    maxPlayers?: number | null
    ageRating?: string | null
    genre?: string | null
    description?: string | null
  }
  submitLabel?: string
}

export function GameForm({ action, defaultValues, submitLabel = "Save" }: GameFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  const [title, setTitle] = useState(defaultValues?.title ?? "")
  const [searchQuery, setSearchQuery] = useState(defaultValues?.title ?? "")
  const [coverUrl, setCoverUrl] = useState(defaultValues?.coverUrl ?? "")
  const [minPlayers, setMinPlayers] = useState(String(defaultValues?.minPlayers ?? ""))
  const [maxPlayers, setMaxPlayers] = useState(String(defaultValues?.maxPlayers ?? ""))
  const [ageRating, setAgeRating] = useState(defaultValues?.ageRating ?? "")
  const [genre, setGenre] = useState(defaultValues?.genre ?? "")
  const [description, setDescription] = useState(defaultValues?.description ?? "")

  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([])
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
        const results = await searchGamesByTitle(searchQuery)
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

  async function handleSelect(suggestion: GameSuggestion) {
    setTitle(suggestion.title)
    setSearchQuery("")
    setShowDropdown(false)
    setSuggestions([])
    setIsLookingUp(true)
    try {
      const detail = await getGameByBggId(suggestion.bggId)
      if (detail) {
        setCoverUrl(detail.coverUrl ?? "")
        setMinPlayers(String(detail.minPlayers ?? ""))
        setMaxPlayers(String(detail.maxPlayers ?? ""))
        setAgeRating(detail.ageRating ?? "")
        setGenre(detail.genre ?? "")
        setDescription(detail.description ?? "")
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
        <input id="title" name="title" required value={title}
          onChange={(e) => { setTitle(e.target.value); setSearchQuery(e.target.value) }}
          className={inputClass} />
        {searchError && <p className="text-xs text-red-600">{searchError}</p>}
        {(showDropdown || isSearching) && suggestions.length > 0 && (
          <ul className="absolute top-full z-10 mt-1 w-full rounded-lg border border-edge bg-surface shadow-lg">
            {isSearching && <li className="px-3 py-2 text-sm text-ink-muted">Searching…</li>}
            {suggestions.map((s) => (
              <li key={s.bggId}>
                <button type="button" onClick={() => handleSelect(s)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface-raised">
                  <span className="font-medium">{s.title}</span>
                  {s.year && <span className="ml-1 text-ink-muted">({s.year})</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label className={labelClass} htmlFor="minPlayers">Min Players</label>
          <input id="minPlayers" name="minPlayers" type="number" value={minPlayers}
            onChange={(e) => setMinPlayers(e.target.value)} className={inputClass} disabled={isLookingUp} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className={labelClass} htmlFor="maxPlayers">Max Players</label>
          <input id="maxPlayers" name="maxPlayers" type="number" value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)} className={inputClass} disabled={isLookingUp} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="ageRating">Age Rating</label>
        <input id="ageRating" name="ageRating" value={ageRating}
          onChange={(e) => setAgeRating(e.target.value)} className={inputClass}
          placeholder="e.g. 10+" disabled={isLookingUp} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="genre">Genre / Category</label>
        <input id="genre" name="genre" value={genre}
          onChange={(e) => setGenre(e.target.value)} className={inputClass} disabled={isLookingUp} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} value={description}
          onChange={(e) => setDescription(e.target.value)} className={inputClass} disabled={isLookingUp} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="coverUrl">Cover Image URL</label>
        <input id="coverUrl" name="coverUrl" type="url" value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)} className={inputClass} />
      </div>

      {isLookingUp && <p className="text-sm text-ink-muted">Loading details…</p>}

      <button type="submit" disabled={isPending || isLookingUp} className={`self-start ${btnPrimary}`}>
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  )
}

import { useCallback, useEffect, useState } from "react"
import { getCached, setCached } from "./cache"

export type QueryState<T> = {
  data: T | null
  loading: boolean
  refreshing: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useCachedQuery<T>(key: string, load: () => Promise<T>): QueryState<T> {
  const [data, setData] = useState<T | null>(() => getCached<T>(key))
  const [loading, setLoading] = useState(data === null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    setRefreshing(true)
    try {
      const next = await load()
      setCached(key, next)
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [key, load])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, refreshing, error, reload }
}

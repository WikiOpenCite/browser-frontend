import { useEffect, useState } from 'react'
import { fetchCitations } from './api'
import type { CitationsResponse } from './types'

/** A submitted query. `nonce` lets the same filter be run again. */
export interface Search {
  filter: string
  nonce: number
}

interface State {
  loading: boolean
  data: CitationsResponse | null
  error: Error | null
}

const IDLE: State = { loading: false, data: null, error: null }

export function useCitations(search: Search | null, page: number, rowsPerPage: number): State {
  const [state, setState] = useState<State>(IDLE)

  useEffect(() => {
    if (!search) {
      setState(IDLE)
      return
    }
    const controller = new AbortController()
    // Keep showing the previous page while the next one loads.
    setState((prev) => ({ loading: true, data: prev.data, error: null }))

    fetchCitations(search.filter, rowsPerPage, page * rowsPerPage, controller.signal)
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ loading: false, data: null, error: err instanceof Error ? err : new Error(String(err)) })
      })

    return () => controller.abort()
  }, [search, page, rowsPerPage])

  return state
}

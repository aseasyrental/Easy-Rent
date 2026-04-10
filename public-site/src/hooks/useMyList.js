import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'easyRentalMyList'

function getSnapshot() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw || '[]'
}

function subscribe(callback) {
  const handler = (e) => {
    if (e.key === STORAGE_KEY) callback()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

let listeners = []
function emitChange() {
  for (const l of listeners) l()
}

function subscribeAll(callback) {
  listeners.push(callback)
  const unsub = subscribe(callback)
  return () => {
    listeners = listeners.filter(l => l !== callback)
    unsub()
  }
}

function safeParse(raw) {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function useMyList() {
  const raw = useSyncExternalStore(subscribeAll, getSnapshot)
  const ids = safeParse(raw)

  const toggle = useCallback((id) => {
    const current = safeParse(localStorage.getItem(STORAGE_KEY) || '[]')
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // localStorage full — toggle still works for this session
    }
    emitChange()
  }, [])

  const has = useCallback((id) => ids.includes(id), [ids])

  const clear = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '[]')
    emitChange()
  }, [])

  const shareUrl = ids.length > 0
    ? `${window.location.origin}/picks?ids=${ids.join(',')}`
    : null

  return { ids, count: ids.length, toggle, has, clear, shareUrl }
}

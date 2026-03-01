// Custom hooks for Easy Rent application
// Add your reusable hooks here

import { useState, useCallback } from 'react'

// Example hook for API requests
export function useApi(initialData = null) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (apiCall) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCall()
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, request }
}

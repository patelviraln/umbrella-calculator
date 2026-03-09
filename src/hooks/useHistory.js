import { useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'umbrella_calc_history'
const MAX_HISTORY = 50
const SCHEMA_VERSION = 1

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Basic schema check
    return parsed.filter(r => r && r.id && r.timestamp && r.inputs && r.results)
  } catch {
    return []
  }
}

function buildLabel(inputs, results) {
  const rateStr = inputs.rateUnit === 'year'
    ? `£${Math.round(inputs.rate).toLocaleString()}/yr`
    : inputs.rateUnit === 'month'
    ? `£${Math.round(inputs.rate).toLocaleString()}/mo`
    : inputs.rateUnit === 'week'
    ? `£${Math.round(inputs.rate).toLocaleString()}/wk`
    : inputs.rateUnit === 'day'
    ? `£${Math.round(inputs.rate).toLocaleString()}/day`
    : `£${Math.round(inputs.rate)}/hr`

  const takeHome = `£${Math.round(results.takeHome).toLocaleString()}/yr`
  return `${rateStr} → ${takeHome}`
}

export function useHistory() {
  const [history, setHistory] = useState(loadHistory)

  const saveResult = useCallback((inputs, results) => {
    const record = {
      _v: SCHEMA_VERSION,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      inputs,
      results: {
        takeHome: results.takeHome,
        monthlyTakeHome: results.monthly.takeHome,
        weeklyTakeHome: results.weekly.takeHome,
        incomeTax: results.incomeTax,
        employeeNI: results.employeeNI,
        employerNI: results.employerNI,
        totalPension: results.totalPension,
        studentLoan: results.studentLoan,
        effectiveTaxRate: results.effectiveTaxRate,
        effectiveTotalRate: results.effectiveTotalRate,
        _full: results,
      },
      label: buildLabel(inputs, results),
    }

    setHistory(prev => {
      const next = [record, ...prev].slice(0, MAX_HISTORY)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })

    return record.id
  }, [])

  const deleteRecord = useCallback((id) => {
    setHistory(prev => {
      const next = prev.filter(r => r.id !== id)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setHistory([])
  }, [])

  const bestTakeHome = useMemo(() =>
    history.reduce((best, r) =>
      r.results.takeHome > (best?.results.takeHome ?? -1) ? r : best, null
    ), [history])

  return { history, saveResult, deleteRecord, clearAll, bestTakeHome }
}

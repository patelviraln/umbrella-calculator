import { useState } from 'react'
import { History as HistoryIcon, Trash2, ArrowDownUp, ChevronDown, ChevronUp } from 'lucide-react'
import HistoryItem from './HistoryItem'

export default function History({ history, bestId, onReload, onDelete, onClearAll }) {
  const [sortBy, setSortBy] = useState('date')
  const [confirmClear, setConfirmClear] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const sorted = [...history].sort((a, b) => {
    if (sortBy === 'takehome') return b.results.takeHome - a.results.takeHome
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  return (
    <div className="section-card h-fit">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-gray-100 cursor-pointer select-none"
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-2">
          <HistoryIcon size={16} className="text-orange-500" />
          <h2 className="font-semibold text-gray-800 text-sm">Search History</h2>
          {history.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {history.length}
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
      </div>

      {!collapsed && (
        <>
          {history.length > 1 && (
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 bg-gray-50">
              <button
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors"
                onClick={() => setSortBy(s => s === 'date' ? 'takehome' : 'date')}
              >
                <ArrowDownUp size={12} />
                Sort by: {sortBy === 'date' ? 'Date' : 'Take-home'}
              </button>

              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Delete all?</span>
                  <button
                    className="text-xs text-red-600 font-semibold hover:underline"
                    onClick={() => { onClearAll(); setConfirmClear(false) }}
                  >Yes</button>
                  <button
                    className="text-xs text-gray-400 hover:underline"
                    onClick={() => setConfirmClear(false)}
                  >No</button>
                </div>
              ) : (
                <button
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 size={11} />
                  Clear all
                </button>
              )}
            </div>
          )}

          <div className="p-3 max-h-[70vh] overflow-y-auto space-y-2">
            {sorted.length === 0 ? (
              <div className="text-center py-10">
                <HistoryIcon size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No calculations yet.</p>
                <p className="text-xs text-gray-300 mt-1">Results will appear here automatically.</p>
              </div>
            ) : (
              sorted.map(record => (
                <HistoryItem
                  key={record.id}
                  record={record}
                  isBest={record.id === bestId}
                  onReload={onReload}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

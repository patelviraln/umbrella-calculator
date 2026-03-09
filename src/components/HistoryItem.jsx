import { Trash2, Clock, Star } from 'lucide-react'
import { fmt } from '../utils/taxCalculations'

export default function HistoryItem({ record, isBest, onReload, onDelete }) {
  const { inputs, results, label, timestamp } = record

  const date = new Date(timestamp)
  const dateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className={`
        relative rounded-xl border p-4 cursor-pointer transition-all duration-150
        hover:shadow-md hover:border-orange-300 active:scale-[0.99]
        ${isBest
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 bg-white hover:bg-orange-50'
        }
      `}
      onClick={() => onReload(record)}
    >
      {isBest && (
        <div className="absolute top-2 right-8 flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          <Star size={10} className="fill-green-600" />
          BEST
        </div>
      )}

      <div className="pr-6">
        <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
        <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-gray-500">
          <span>{fmt(results.monthlyTakeHome)}/mo</span>
          <span>{fmt(results.weeklyTakeHome)}/wk</span>
          <span>Tax: {fmt(results.incomeTax)}</span>
          <span>NI: {fmt(results.employeeNI)}</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          <span>{dateStr} {timeStr}</span>
          <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
            {inputs.taxYear}
          </span>
        </div>
      </div>

      <button
        className="absolute top-3 right-3 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
        onClick={e => { e.stopPropagation(); onDelete(record.id) }}
        aria-label="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

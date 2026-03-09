import { useState, useCallback } from 'react'
import { Calculator as CalcIcon } from 'lucide-react'
import { TAX_YEARS } from './utils/taxRates'
import { calculateUmbrella, annualise } from './utils/taxCalculations'
import { useHistory } from './hooks/useHistory'
import Calculator from './components/Calculator'
import Results from './components/Results'
import History from './components/History'

const DEFAULT_INPUTS = {
  rate: 500,
  rateUnit: 'day',
  hoursPerWeek: 40,
  taxYear: '2024/25',
  taxCode: '1257L',
  niCategory: 'A',
  dateOfBirth: '',
  umbrellaMargin: 25,
  umbrellaMarginUnit: 'week',
  holidayMethod: 'rolled-up',
  includeApprenticeLevy: true,
  pensionType: 'salary-sacrifice',
  pensionEmployeeRate: 0.05,
  pensionEmployerRate: 0.03,
  studentLoanPlan: 'none',
  blindPersonAllowance: false,
  marriageAllowanceReceived: false,
  marriageAllowanceGiven: false,
}

export default function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const { history, saveResult, deleteRecord, clearAll, bestTakeHome } = useHistory()

  const handleCalculate = useCallback(() => {
    setError(null)

    // Validate
    if (!inputs.rate || inputs.rate <= 0) {
      setError('Please enter a valid rate.')
      return
    }
    if (inputs.rateUnit === 'hour' && (!inputs.hoursPerWeek || inputs.hoursPerWeek <= 0)) {
      setError('Please enter hours per week for hourly rate.')
      return
    }

    const rates = TAX_YEARS[inputs.taxYear]
    if (!rates) {
      setError('Invalid tax year selected.')
      return
    }

    const annualRate = annualise(inputs.rate, inputs.rateUnit, inputs.hoursPerWeek)
    const annualMargin = annualise(inputs.umbrellaMargin, inputs.umbrellaMarginUnit, inputs.hoursPerWeek)

    const calcInputs = {
      ...inputs,
      annualRate,
      annualMargin,
    }

    const res = calculateUmbrella(calcInputs, rates)

    if (res.takeHome <= 0) {
      setError('Take-home is zero or negative with these settings. Check your margin, tax code, and rate.')
    }

    setResults(res)
    saveResult(calcInputs, res)
  }, [inputs, saveResult])

  const handleReload = useCallback((record) => {
    setInputs(record.inputs)
    setResults(record.results._full)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2">
            <CalcIcon size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Umbrella Contractor Calculator</h1>
            <p className="text-orange-100 text-xs">UK take-home pay estimator with history</p>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Calculator + Results */}
        <div className="lg:col-span-2 space-y-5">
          <Calculator
            inputs={inputs}
            onChange={setInputs}
            onCalculate={handleCalculate}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {results && (
            <Results results={results} inputs={inputs} />
          )}
        </div>

        {/* Right: History */}
        <div className="lg:col-span-1">
          <History
            history={history}
            bestId={bestTakeHome?.id}
            onReload={handleReload}
            onDelete={deleteRecord}
            onClearAll={clearAll}
          />
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Results are estimates only. Consult a tax professional for advice.
        Calculations use HMRC published rates.
      </footer>
    </div>
  )
}

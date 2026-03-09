import { useState } from 'react'
import { TrendingDown, PiggyBank, BookOpen, Wallet } from 'lucide-react'
import { fmt, fmtPct } from '../utils/taxCalculations'

function DeductionRow({ label, value, isTotal, isFinal, isPositive }) {
  return (
    <div className={`deduction-row ${isTotal ? 'font-semibold text-gray-800' : 'text-gray-600'} ${isFinal ? 'border-t-2 border-gray-200 mt-1 pt-2' : ''}`}>
      <span>{label}</span>
      <span className={isPositive ? 'text-green-600' : value < 0 || (!isPositive && value !== undefined) ? '' : ''}>
        {value !== undefined ? (isPositive ? fmt(Math.abs(value)) : (value >= 0 ? fmt(value) : `−${fmt(Math.abs(value))}`)) : ''}
      </span>
    </div>
  )
}

function Panel({ title, icon: Icon, children, accent }) {
  return (
    <div className={`result-card border-l-4 ${accent || 'border-orange-400'}`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={16} className="text-orange-500" />}
        <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function Results({ results, inputs }) {
  const [period, setPeriod] = useState('annual')

  const r = results
  const m = r.monthly
  const w = r.weekly

  const takeHomeByPeriod = { annual: r.takeHome, monthly: m.takeHome, weekly: w.takeHome }
  const grossByPeriod    = { annual: r.employeeGross, monthly: m.employeeGross, weekly: w.employeeGross }
  const taxByPeriod      = { annual: r.incomeTax, monthly: m.incomeTax, weekly: w.incomeTax }
  const niByPeriod       = { annual: r.employeeNI, monthly: m.employeeNI, weekly: w.employeeNI }

  return (
    <div className="space-y-4">
      {/* ── Take-Home Summary ── */}
      <div className="result-card border-l-4 border-orange-500 bg-gradient-to-br from-white to-orange-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            <Wallet size={16} className="text-orange-500" />
            Take-Home Pay
          </h3>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {['annual', 'monthly', 'weekly'].map(p => (
              <button
                key={p}
                className={`px-2.5 py-1 transition-colors ${period === p ? 'bg-orange-500 text-white font-medium' : 'bg-white text-gray-500 hover:bg-orange-50'}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center py-2">
          <p className="text-4xl font-bold text-gray-900">{fmt(takeHomeByPeriod[period])}</p>
          <p className="text-sm text-gray-400 mt-1">
            {period === 'annual' ? 'per year' : period === 'monthly' ? 'per month' : 'per week'}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center border-t border-orange-100 pt-3">
          <div>
            <p className="text-xs text-gray-400">Effective Tax Rate</p>
            <p className="text-sm font-semibold text-gray-700">{fmtPct(r.effectiveTaxRate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Overall Deduction</p>
            <p className="text-sm font-semibold text-gray-700">{fmtPct(r.effectiveTotalRate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Employee Gross</p>
            <p className="text-sm font-semibold text-gray-700">{fmt(grossByPeriod[period])}</p>
          </div>
        </div>
      </div>

      {/* ── Employment Cost Waterfall ── */}
      <Panel title="Employment Cost Breakdown" icon={TrendingDown} accent="border-red-300">
        <div className="space-y-0.5">
          <DeductionRow label="Assignment Rate" value={r.assignmentRate} isTotal />
          {r.employerNI > 0 && (
            <div className="deduction-row text-gray-500">
              <span>Less: Employer NI ({inputs.taxYear})</span>
              <span className="text-red-500">−{fmt(r.employerNI)}</span>
            </div>
          )}
          {r.apprenticeLevy > 0 && (
            <div className="deduction-row text-gray-500">
              <span>Less: Apprenticeship Levy (0.5%)</span>
              <span className="text-red-500">−{fmt(r.apprenticeLevy)}</span>
            </div>
          )}
          {r.employerPension > 0 && (
            <div className="deduction-row text-gray-500">
              <span>Less: Employer Pension</span>
              <span className="text-red-500">−{fmt(r.employerPension)}</span>
            </div>
          )}
          {r.umbrellaMargin > 0 && (
            <div className="deduction-row text-gray-500">
              <span>Less: Umbrella Margin</span>
              <span className="text-red-500">−{fmt(r.umbrellaMargin)}</span>
            </div>
          )}
          {r.holidayPot > 0 && (
            <div className="deduction-row text-gray-500">
              <span>Less: Holiday Accrual (12.07%)</span>
              <span className="text-amber-500">−{fmt(r.holidayPot)}</span>
            </div>
          )}
          <div className="deduction-row font-semibold text-gray-800 border-t border-gray-200 mt-1 pt-2">
            <span>= Employee Gross</span>
            <span className="text-green-600">{fmt(r.employeeGross)}</span>
          </div>
        </div>
      </Panel>

      {/* ── Tax Breakdown ── */}
      <Panel title="Income Tax" icon={BookOpen} accent="border-blue-300">
        <div className="space-y-0.5">
          {r.salarySacrifice > 0 ? (
            <>
              <div className="deduction-row text-gray-500">
                <span>Employee Gross</span>
                <span>{fmt(r.employeeGross)}</span>
              </div>
              <div className="deduction-row text-gray-500">
                <span>Less: Salary Sacrifice</span>
                <span className="text-green-600">−{fmt(r.salarySacrifice)}</span>
              </div>
              <div className="deduction-row text-gray-700 font-medium border-t border-gray-100 pt-1">
                <span>= Taxable Income</span>
                <span>{fmt(r.taxableGross)}</span>
              </div>
            </>
          ) : (
            <div className="deduction-row text-gray-500">
              <span>Taxable Income</span>
              <span>{fmt(r.taxableGross)}</span>
            </div>
          )}
          {r.effectivePA > 0 && (
            <div className="deduction-row text-gray-500">
              <span>Less: Personal Allowance</span>
              <span className="text-green-600">−{fmt(r.effectivePA)}</span>
            </div>
          )}
          {r.taxBasic > 0 && (
            <div className="deduction-row text-gray-500 text-xs">
              <span className="pl-2">Basic rate (20%)</span>
              <span>{fmt(r.taxBasic)}</span>
            </div>
          )}
          {r.taxHigher > 0 && (
            <div className="deduction-row text-gray-500 text-xs">
              <span className="pl-2">Higher rate (40%)</span>
              <span>{fmt(r.taxHigher)}</span>
            </div>
          )}
          {r.taxAdditional > 0 && (
            <div className="deduction-row text-gray-500 text-xs">
              <span className="pl-2">Additional rate (45%)</span>
              <span>{fmt(r.taxAdditional)}</span>
            </div>
          )}
          <div className="deduction-row font-semibold text-gray-800 border-t border-gray-200 mt-1 pt-2">
            <span>Total Income Tax</span>
            <span className="text-red-500">{fmt(r.incomeTax)}</span>
          </div>
        </div>

        {/* NI inline */}
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 mb-1">National Insurance</p>
          <div className="deduction-row text-gray-500">
            <span>Employee NI (Cat {inputs.niCategory})</span>
            <span className="text-red-400">{fmt(r.employeeNI)}</span>
          </div>
          <div className="deduction-row text-gray-500">
            <span>Employer NI</span>
            <span className="text-red-400">{fmt(r.employerNI)}</span>
          </div>
        </div>

        {r.studentLoan > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-1">Student Loan</p>
            <div className="deduction-row text-gray-500">
              <span>{inputs.studentLoanPlan === 'postgrad' ? 'Postgrad Loan' : inputs.studentLoanPlan?.toUpperCase()}</span>
              <span className="text-red-400">{fmt(r.studentLoan)}</span>
            </div>
          </div>
        )}
      </Panel>

      {/* ── Pension ── */}
      {r.totalPension > 0 && (
        <Panel title="Pension" icon={PiggyBank} accent="border-purple-300">
          <div className="space-y-0.5">
            {r.salarySacrifice > 0 && (
              <div className="deduction-row text-gray-500">
                <span>Salary Sacrifice (employee)</span>
                <span>{fmt(r.salarySacrifice)}</span>
              </div>
            )}
            {r.personalPension > 0 && (
              <div className="deduction-row text-gray-500">
                <span>Personal Pension (employee)</span>
                <span>{fmt(r.personalPension)}</span>
              </div>
            )}
            {r.employerPension > 0 && (
              <div className="deduction-row text-gray-500">
                <span>Employer Contribution</span>
                <span>{fmt(r.employerPension)}</span>
              </div>
            )}
            <div className="deduction-row font-semibold text-gray-800 border-t border-gray-200 mt-1 pt-2">
              <span>Total Pension Pot (annual)</span>
              <span className="text-purple-600">{fmt(r.totalPension)}</span>
            </div>
            {r.taxRelief > 0 && (
              <div className="deduction-row text-gray-500">
                <span>Tax Relief to Claim</span>
                <span className="text-green-600">{fmt(r.taxRelief)}</span>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  )
}

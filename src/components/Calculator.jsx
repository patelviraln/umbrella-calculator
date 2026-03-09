import { useState } from 'react'
import {
  ChevronDown, ChevronUp, DollarSign, Settings, Briefcase,
  PiggyBank, BookOpen, Heart, AlertCircle
} from 'lucide-react'
import { TAX_YEAR_OPTIONS, NI_CATEGORIES, STUDENT_LOAN_PLANS } from '../utils/taxRates'
import { inferNICategory, parseTaxCode } from '../utils/taxCalculations'

function Section({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={15} className="text-orange-500" />}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function AmountWithUnit({ valueKey, unitKey, inputs, onChange, units }) {
  return (
    <div className="flex gap-2">
      <input
        type="number"
        min="0"
        step="1"
        value={inputs[valueKey]}
        onChange={e => onChange({ [valueKey]: parseFloat(e.target.value) || 0 })}
        className="input-field flex-1"
        placeholder="0"
      />
      <select
        value={inputs[unitKey]}
        onChange={e => onChange({ [unitKey]: e.target.value })}
        className="input-field w-28"
      >
        {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
      </select>
    </div>
  )
}

export default function Calculator({ inputs, onChange, onCalculate }) {
  const update = (patch) => onChange(prev => ({ ...prev, ...patch }))

  const taxCodeParsed = parseTaxCode(inputs.taxCode)
  const taxCodeWarning =
    inputs.taxCode?.toUpperCase().startsWith('S') ? 'Scottish taxpayer: using England bands as approximation.' :
    taxCodeParsed.isEmergency ? 'Emergency tax code — may result in higher withholding.' :
    null

  const handleDOBChange = (dob) => {
    const suggested = inferNICategory(dob)
    update({ dateOfBirth: dob, niCategory: suggested || inputs.niCategory })
  }

  return (
    <div className="section-card">
      {/* Rate Section (always visible) */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={15} className="text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-700">Your Rate</h2>
        </div>

        <Field label="Umbrella rate">
          <AmountWithUnit
            valueKey="rate"
            unitKey="rateUnit"
            inputs={inputs}
            onChange={update}
            units={[
              { value: 'year', label: 'Per Year' },
              { value: 'month', label: 'Per Month' },
              { value: 'week', label: 'Per Week' },
              { value: 'day', label: 'Per Day' },
              { value: 'hour', label: 'Per Hour' },
            ]}
          />
        </Field>

        {inputs.rateUnit === 'hour' && (
          <Field label="Hours per week" hint="Used to annualise your hourly rate">
            <input
              type="number" min="1" max="168" step="0.5"
              value={inputs.hoursPerWeek}
              onChange={e => update({ hoursPerWeek: parseFloat(e.target.value) || 40 })}
              className="input-field"
            />
          </Field>
        )}
      </div>

      {/* Tax Settings */}
      <Section title="Tax Settings" icon={Settings} defaultOpen>
        <Field label="Tax year">
          <select
            value={inputs.taxYear}
            onChange={e => update({ taxYear: e.target.value })}
            className="input-field"
          >
            {TAX_YEAR_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Tax code" hint="e.g. 1257L, BR, D0, K475">
          <input
            type="text"
            value={inputs.taxCode}
            onChange={e => update({ taxCode: e.target.value })}
            className="input-field"
            placeholder="1257L"
          />
          {taxCodeWarning && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {taxCodeWarning}
            </p>
          )}
        </Field>

        <Field label="NI category">
          <select
            value={inputs.niCategory}
            onChange={e => update({ niCategory: e.target.value })}
            className="input-field"
          >
            {NI_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Date of birth" hint="Used to suggest NI category (under 21 → M, over 66 → C)">
          <input
            type="date"
            value={inputs.dateOfBirth}
            onChange={e => handleDOBChange(e.target.value)}
            className="input-field"
          />
        </Field>
      </Section>

      {/* Employment Costs */}
      <Section title="Employment Costs" icon={Briefcase} defaultOpen>
        <Field label="Umbrella margin">
          <AmountWithUnit
            valueKey="umbrellaMargin"
            unitKey="umbrellaMarginUnit"
            inputs={inputs}
            onChange={update}
            units={[
              { value: 'week', label: 'Per Week' },
              { value: 'month', label: 'Per Month' },
              { value: 'year', label: 'Per Year' },
            ]}
          />
        </Field>

        <Field label="Holiday pay method">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            {['rolled-up', 'accrual'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => update({ holidayMethod: m })}
                className={`flex-1 py-2 px-3 transition-colors ${inputs.holidayMethod === m ? 'bg-orange-500 text-white font-medium' : 'bg-white text-gray-600 hover:bg-orange-50'}`}
              >
                {m === 'rolled-up' ? 'Rolled-up' : 'Accrual'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {inputs.holidayMethod === 'accrual'
              ? 'Holiday pay (12.07%) is withheld and paid when leave is taken.'
              : 'Holiday pay is included in your rate — no separate pot.'
            }
          </p>
        </Field>

        <Field label="">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={inputs.includeApprenticeLevy}
              onChange={e => update({ includeApprenticeLevy: e.target.checked })}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm text-gray-700">Include Apprenticeship Levy (0.5%)</span>
          </label>
          <p className="text-xs text-gray-400 mt-1 ml-6">Applies to umbrella companies with pay bill over £3m/yr</p>
        </Field>
      </Section>

      {/* Pension */}
      <Section title="Pension" icon={PiggyBank}>
        <Field label="Pension type">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'opt-out', label: 'Opt out' },
              { value: 'salary-sacrifice', label: 'Salary sacrifice' },
              { value: 'personal', label: 'Personal pension' },
              { value: 'employer-only', label: 'Employer only' },
            ].map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ pensionType: t.value })}
                className={`py-2 px-3 rounded-lg border text-sm transition-colors ${inputs.pensionType === t.value ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        {inputs.pensionType !== 'opt-out' && inputs.pensionType !== 'employer-only' && (
          <Field label="Employee contribution (%)">
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" max="100" step="0.5"
                value={(inputs.pensionEmployeeRate * 100).toFixed(1)}
                onChange={e => update({ pensionEmployeeRate: (parseFloat(e.target.value) || 0) / 100 })}
                className="input-field w-24"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </Field>
        )}

        <Field label="Employer contribution (%)">
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" max="100" step="0.5"
              value={(inputs.pensionEmployerRate * 100).toFixed(1)}
              onChange={e => update({ pensionEmployerRate: (parseFloat(e.target.value) || 0) / 100 })}
              className="input-field w-24"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </Field>
      </Section>

      {/* Student Loans */}
      <Section title="Student Loans" icon={BookOpen}>
        <Field label="Repayment plan">
          <div className="space-y-2">
            {STUDENT_LOAN_PLANS.map(p => (
              <label key={p.value} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="studentLoan"
                  value={p.value}
                  checked={inputs.studentLoanPlan === p.value}
                  onChange={() => update({ studentLoanPlan: p.value })}
                  className="accent-orange-500"
                />
                <span className="text-sm text-gray-700">{p.label}</span>
              </label>
            ))}
          </div>
        </Field>
      </Section>

      {/* Allowances */}
      <Section title="Allowances" icon={Heart}>
        <div className="space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={inputs.blindPersonAllowance}
              onChange={e => update({ blindPersonAllowance: e.target.checked })}
              className="w-4 h-4 mt-0.5 accent-orange-500"
            />
            <div>
              <span className="text-sm text-gray-700">Blind Person's Allowance</span>
              <p className="text-xs text-gray-400">Adds ~£2,870–£3,070 to your personal allowance</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={inputs.marriageAllowanceReceived}
              onChange={e => update({ marriageAllowanceReceived: e.target.checked, marriageAllowanceGiven: false })}
              className="w-4 h-4 mt-0.5 accent-orange-500"
            />
            <div>
              <span className="text-sm text-gray-700">Marriage Allowance — receiving transfer</span>
              <p className="text-xs text-gray-400">Your partner transfers 10% of their PA to you (+~£1,260)</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={inputs.marriageAllowanceGiven}
              onChange={e => update({ marriageAllowanceGiven: e.target.checked, marriageAllowanceReceived: false })}
              className="w-4 h-4 mt-0.5 accent-orange-500"
            />
            <div>
              <span className="text-sm text-gray-700">Marriage Allowance — transferring to partner</span>
              <p className="text-xs text-gray-400">You transfer 10% of your PA to your partner (−~£1,260)</p>
            </div>
          </label>
        </div>
      </Section>

      {/* Calculate Button */}
      <div className="px-5 py-5">
        <button type="button" onClick={onCalculate} className="btn-primary">
          Calculate Take-Home
        </button>
      </div>
    </div>
  )
}

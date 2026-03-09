# Umbrella Contractor Calculator

A personalised UK umbrella company take-home pay calculator with persistent search history. Enter your day/hourly/salary rate and get a full breakdown of income tax, National Insurance, pension, and student loan deductions — with every calculation saved so you can compare scenarios side by side.

## Features

- **Full UK umbrella pay waterfall** — models every deduction in the correct order: employer NI → apprenticeship levy → employer pension → umbrella margin → holiday pay → salary sacrifice → employee NI → income tax → student loan
- **9 tax year periods** — covers 2020/21 through 2025/26, including mid-year NI changes (e.g. HSCL levy, January 2024 NI cut)
- **Expected working days** — set actual billable days per year (not just a fixed 260), with 220/240/260 presets. Critical for contractors who don't work a full year
- **Search history** — every calculation is saved to localStorage automatically. Click any past result to reload its inputs instantly
- **Best take-home highlight** — the history panel badges the scenario with the highest annual take-home
- **Reset button** — one click restores all inputs to defaults
- **Responsive layout** — two-column on desktop, stacked on mobile

## Calculation Inputs

| Section | Fields |
|---------|--------|
| Rate | Amount + unit (Year / Month / Week / **Day** / Hour), working days (day rate only), hours/week (hourly only) |
| Tax Settings | Tax year, tax code (1257L, BR, D0, D1, NT, K-codes), NI category (A/B/C/H/J/M/Z), date of birth |
| Employment Costs | Umbrella margin (weekly/monthly/annual), holiday pay method (rolled-up / accrual), apprenticeship levy toggle |
| Pension | Type (opt-out / salary sacrifice / personal / employer-only), employee %, employer % |
| Student Loans | None / Plan 1 / Plan 2 / Plan 4 / Postgrad |
| Allowances | Blind Person's Allowance, Marriage Allowance (receiving or transferring) |

## Calculation Outputs

| Panel | Shows |
|-------|-------|
| Take-Home Pay | Annual / monthly / weekly net pay, effective tax rate, overall deduction % |
| Employment Cost Breakdown | Waterfall from assignment rate → employee gross |
| Income Tax | Salary sacrifice step, personal allowance (with taper), band breakdown (20% / 40% / 45%), total tax |
| National Insurance | Employee NI (by category) + employer NI |
| Pension | Salary sacrifice, personal, employer contributions + tax relief to claim |
| Student Loan | Plan name + annual repayment |

## Tax Years Supported

| Period | Key changes |
|--------|-------------|
| 2020/21 | Baseline |
| 2021/22 | PA rises to £12,570 |
| 2022/23 (Apr–Jun) | HSCL levy +1.25% on NI rates |
| 2022/23 (Jul–Oct) | Primary threshold raised to £12,570 |
| 2022/23 (Nov–Mar) | HSCL levy reversed |
| 2023/24 (Apr–Jan) | Higher rate limit drops to £125,140 |
| 2023/24 (Jan–Apr) | Employee NI cut to 10% |
| 2024/25 | Employee NI cut to 8% |
| 2025/26 | Employer NI raised to 15%, secondary threshold drops to £5,000 |

## Tax Code Support

| Code | Behaviour |
|------|-----------|
| `1257L` | Standard — personal allowance = digits × 10 |
| `BR` | All income taxed at 20%, no personal allowance |
| `D0` | All income taxed at 40% |
| `D1` | All income taxed at 45% |
| `NT` | No tax |
| `0T` | No personal allowance, standard banding |
| `K475` | Adds £4,750 to taxable income (K-code cap at 50% of gross applies) |
| `W1` / `M1` | Emergency basis — flagged with a warning |
| `S`-prefix | Scottish taxpayer — warning shown (England bands used as approximation) |

Personal allowance taper applies automatically for incomes above £100,000.

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

**Requirements:** Node.js 18+

## Project Structure

```
src/
├── utils/
│   ├── taxRates.js          # Tax/NI constants for every supported year
│   └── taxCalculations.js   # Pure calculation functions (annualise, waterfall, parseTaxCode)
├── hooks/
│   └── useHistory.js        # localStorage read/write, max 50 entries
├── components/
│   ├── Calculator.jsx        # Controlled form with 6 accordion sections
│   ├── Results.jsx           # Output panels
│   ├── History.jsx           # Scrollable history sidebar
│   └── HistoryItem.jsx       # Individual history card
└── App.jsx                   # State orchestration + layout
```

## Stack

- [React 18](https://react.dev) + [Vite 6](https://vitejs.dev)
- [Tailwind CSS 3](https://tailwindcss.com)
- [Lucide React](https://lucide.dev) icons
- No backend — all state in `localStorage`

## Disclaimer

Results are estimates only. Tax calculations use HMRC published rates but do not account for all individual circumstances. Consult a qualified tax adviser before making financial decisions.

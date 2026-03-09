// UK Umbrella Contractor Pay Waterfall Calculator

export function annualise(amount, unit, hoursPerWeek = 40, workingDays = 260) {
  const n = parseFloat(amount) || 0
  switch (unit) {
    case 'year':  return n
    case 'month': return n * 12
    case 'week':  return n * 52
    case 'day':   return n * workingDays
    case 'hour':  return n * hoursPerWeek * 52
    default:      return n
  }
}

export function parseTaxCode(raw) {
  const code = (raw || '1257L').toUpperCase().trim()

  if (code === 'BR')  return { type: 'flat', rate: 0.20, pa: 0 }
  if (code === 'D0')  return { type: 'flat', rate: 0.40, pa: 0 }
  if (code === 'D1')  return { type: 'flat', rate: 0.45, pa: 0 }
  if (code === 'NT')  return { type: 'none', rate: 0, pa: 0 }
  if (code === '0T')  return { type: 'standard', pa: 0 }

  // Scottish / Welsh prefix — treat same as England for now, flag it
  const prefixed = code.replace(/^[SCW]/, '')

  // K code: adds to taxable income
  const kMatch = prefixed.match(/^K(\d+)$/)
  if (kMatch) return { type: 'k', kAddition: parseInt(kMatch[1]) * 10, pa: 0 }

  // Emergency suffix W1/M1/X
  const isEmergency = /W1$|M1$|X$/.test(prefixed)
  const numMatch = prefixed.match(/^(\d+)/)
  if (numMatch) {
    return { type: 'standard', pa: parseInt(numMatch[1]) * 10, isEmergency }
  }

  return { type: 'standard', pa: 12570 }
}

function applyPATaper(pa, grossIncome) {
  if (grossIncome <= 100000) return pa
  const taper = Math.floor((grossIncome - 100000) / 2)
  return Math.max(0, pa - taper)
}

function round2(n) {
  return Math.round(n * 100) / 100
}

export function calculateUmbrella(inputs, rates) {
  const {
    annualRate,
    annualMargin,
    niCategory = 'A',
    taxCode = '1257L',
    holidayMethod = 'rolled-up',
    pensionType = 'salary-sacrifice',
    pensionEmployeeRate = 0,
    pensionEmployerRate = 0.03,
    studentLoanPlan = 'none',
    blindPersonAllowance = false,
    marriageAllowanceReceived = false,
    marriageAllowanceGiven = false,
    includeApprenticeLevy = true,
  } = inputs

  const ni = rates.ni

  // ── (1) Assignment Rate ────────────────────────────────────────────────
  const assignmentRate = annualRate

  // ── (2) Employer NI ───────────────────────────────────────────────────
  let employerNI = 0
  if (niCategory !== 'C') {
    // For salary sacrifice, employer NI base is reduced — handled after step 8
    const aboveSecondary = Math.max(0, assignmentRate - ni.secondaryThreshold)
    employerNI = round2(aboveSecondary * ni.employerRate)
  }

  // ── (3) Apprenticeship Levy ───────────────────────────────────────────
  const apprenticeLevy = includeApprenticeLevy
    ? round2(assignmentRate * rates.apprenticeLevy)
    : 0

  // ── (4) Employer Pension (on qualifying earnings from assignment rate) ──
  const qeLower = rates.autoEnrolment.lower
  const qeUpper = rates.autoEnrolment.upper
  const qualifyingEarnings = Math.max(0, Math.min(assignmentRate, qeUpper) - qeLower)
  const employerPension = round2(qualifyingEarnings * pensionEmployerRate)

  // ── (5) Pre-holiday gross ─────────────────────────────────────────────
  const preHolidayGross = assignmentRate - employerNI - apprenticeLevy - annualMargin - employerPension

  // ── (6) Holiday Pay ───────────────────────────────────────────────────
  let employeeGross, holidayPot
  if (holidayMethod === 'accrual') {
    holidayPot = round2(preHolidayGross * (0.1207 / 1.1207))
    employeeGross = round2(preHolidayGross - holidayPot)
  } else {
    holidayPot = 0
    employeeGross = round2(preHolidayGross)
  }

  // ── (7) Salary Sacrifice Pension ──────────────────────────────────────
  const salarySacrifice = pensionType === 'salary-sacrifice'
    ? round2(employeeGross * pensionEmployeeRate)
    : 0
  const taxableGross = round2(employeeGross - salarySacrifice)

  // ── (8) Employee NI ───────────────────────────────────────────────────
  const empRates = (ni.employeeRates && ni.employeeRates[niCategory]) || ni.employeeRates['A']
  let employeeNI = 0
  if (niCategory !== 'C') {
    const niAbovePT = Math.max(0, Math.min(taxableGross, ni.upperEarningsLimit) - ni.primaryThreshold)
    const niAboveUEL = Math.max(0, taxableGross - ni.upperEarningsLimit)
    employeeNI = round2(niAbovePT * empRates.main + niAboveUEL * empRates.upper)
  }

  // ── (9) Income Tax ────────────────────────────────────────────────────
  const parsed = parseTaxCode(taxCode)
  let incomeTax = 0
  let taxBasic = 0, taxHigher = 0, taxAdditional = 0
  let effectivePA = 0

  if (parsed.type === 'flat') {
    incomeTax = round2(taxableGross * parsed.rate)
    effectivePA = 0
  } else if (parsed.type === 'none') {
    incomeTax = 0
    effectivePA = 0
  } else {
    let pa = parsed.type === 'standard' ? parsed.pa : 0
    if (blindPersonAllowance) pa += (rates.blindPersonAllowance || 2870)
    if (marriageAllowanceReceived) pa += (rates.marriageAllowanceAmount || 1260)
    if (marriageAllowanceGiven) pa -= Math.round((rates.marriageAllowanceAmount || 1260))
    pa = Math.max(0, pa)

    // PA taper for high earners
    effectivePA = applyPATaper(pa, taxableGross)

    let taxableIncome
    if (parsed.type === 'k') {
      taxableIncome = taxableGross + (parsed.kAddition || 0)
    } else {
      taxableIncome = Math.max(0, taxableGross - effectivePA)
    }

    if (taxableIncome > 0) {
      const basicBand = Math.min(taxableIncome, rates.basicRateLimit)
      const higherBand = Math.min(
        Math.max(0, taxableIncome - rates.basicRateLimit),
        rates.higherRateLimit - rates.basicRateLimit
      )
      const additionalBand = Math.max(0, taxableIncome - rates.higherRateLimit)

      taxBasic = round2(basicBand * rates.basicRate)
      taxHigher = round2(higherBand * rates.higherRate)
      taxAdditional = round2(additionalBand * rates.additionalRate)
      incomeTax = taxBasic + taxHigher + taxAdditional

      // K-code cap: tax cannot exceed 50% of gross
      if (parsed.type === 'k') {
        incomeTax = Math.min(incomeTax, round2(taxableGross * 0.50))
      }
    }
  }

  // ── (10) Personal Pension (post-tax, non-sacrifice) ───────────────────
  const personalPension = (pensionType === 'personal')
    ? round2(qualifyingEarnings * pensionEmployeeRate)
    : 0

  // ── (11) Student Loan ──────────────────────────────────────────────────
  let studentLoan = 0
  if (studentLoanPlan !== 'none' && rates.studentLoan[studentLoanPlan]) {
    const sl = rates.studentLoan[studentLoanPlan]
    studentLoan = round2(Math.max(0, taxableGross - sl.threshold) * sl.rate)
  }

  // ── (12) Take-Home ────────────────────────────────────────────────────
  const totalPension = round2(salarySacrifice + personalPension + employerPension)
  const takeHome = round2(Math.max(0,
    employeeGross - salarySacrifice - employeeNI - incomeTax - personalPension - studentLoan
  ))

  // ── (13) Tax Relief to Claim (personal pension gets basic rate relief) ─
  const taxRelief = pensionType === 'personal'
    ? round2(personalPension * rates.basicRate)
    : 0

  const effectiveTaxRate = taxableGross > 0 ? round2(incomeTax / taxableGross) : 0
  const effectiveTotalRate = assignmentRate > 0 ? round2(1 - takeHome / assignmentRate) : 0

  return {
    // Employment cost waterfall
    assignmentRate: round2(assignmentRate),
    employerNI,
    apprenticeLevy,
    employerPension,
    umbrellaMargin: round2(annualMargin),
    holidayPot,
    employeeGross,

    // Employee deductions
    salarySacrifice,
    taxableGross,
    employeeNI,
    incomeTax,
    taxBasic,
    taxHigher,
    taxAdditional,
    effectivePA,
    personalPension,
    studentLoan,

    // Outputs
    takeHome,
    totalPension,
    taxRelief,
    effectiveTaxRate,
    effectiveTotalRate,

    // Period splits
    monthly: {
      takeHome: round2(takeHome / 12),
      employeeGross: round2(employeeGross / 12),
      incomeTax: round2(incomeTax / 12),
      employeeNI: round2(employeeNI / 12),
      employerNI: round2(employerNI / 12),
      studentLoan: round2(studentLoan / 12),
      totalPension: round2(totalPension / 12),
    },
    weekly: {
      takeHome: round2(takeHome / 52),
      employeeGross: round2(employeeGross / 52),
      incomeTax: round2(incomeTax / 52),
      employeeNI: round2(employeeNI / 52),
      studentLoan: round2(studentLoan / 52),
      totalPension: round2(totalPension / 52),
    },
  }
}

export function inferNICategory(dateOfBirth) {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const ageMs = Date.now() - dob.getTime()
  const ageYears = ageMs / (365.25 * 24 * 3600 * 1000)
  if (ageYears >= 66) return 'C'
  if (ageYears < 21) return 'M'
  return 'A'
}

export function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return '£0'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP', maximumFractionDigits: 0
  }).format(n)
}

export function fmtPct(n) {
  if (!n) return '0%'
  return (n * 100).toFixed(1) + '%'
}

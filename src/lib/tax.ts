export interface InsuranceRates {
  pension: number; // 养老保险（个人）
  medical: number; // 医疗保险（个人）
  unemployment: number; // 失业保险（个人）
  housingFund: number; // 住房公积金（个人）
}

export type AccrualMode = 'work' | 'always';

export interface SalaryConfig {
  monthlySalary: number;
  insuranceBase: number | null; // null = 跟随月薪
  rates: InsuranceRates;
  specialDeduction: number;
  startMonth: number; // 入职月份 1-12
  accrualMode: AccrualMode;
  workDays: number[]; // ISO 星期：1=周一 … 7=周日
  workStart: string; // "HH:mm"
  workHoursPerDay: number;
}

export const DEFAULT_CONFIG: SalaryConfig = {
  monthlySalary: 20000,
  insuranceBase: null,
  rates: { pension: 0.08, medical: 0.02, unemployment: 0.005, housingFund: 0.12 },
  specialDeduction: 0,
  startMonth: 1,
  accrualMode: 'work',
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workHoursPerDay: 8,
};

export const BASIC_DEDUCTION = 5000;

const BRACKETS: { cap: number; rate: number; quick: number }[] = [
  { cap: 36000, rate: 0.03, quick: 0 },
  { cap: 144000, rate: 0.1, quick: 2520 },
  { cap: 300000, rate: 0.2, quick: 16920 },
  { cap: 420000, rate: 0.25, quick: 31920 },
  { cap: 660000, rate: 0.3, quick: 52920 },
  { cap: 960000, rate: 0.35, quick: 85920 },
  { cap: Infinity, rate: 0.45, quick: 181920 },
];

export function effectiveBase(cfg: SalaryConfig): number {
  return cfg.insuranceBase ?? cfg.monthlySalary;
}

export function monthlyInsurance(cfg: SalaryConfig): number {
  const { pension, medical, unemployment, housingFund } = cfg.rates;
  return effectiveBase(cfg) * (pension + medical + unemployment + housingFund);
}

export function cumulativeTax(taxable: number): number {
  if (taxable <= 0) return 0;
  const bracket = BRACKETS.find((b) => taxable <= b.cap)!;
  return taxable * bracket.rate - bracket.quick;
}

export interface MonthResult {
  month: number;
  employed: boolean;
  tax: number;
  takeHome: number;
}

// 按累计预扣预缴模拟全年 12 个月（入职月份之前无收入）
export function simulateYear(cfg: SalaryConfig): MonthResult[] {
  const insurance = monthlyInsurance(cfg);
  const results: MonthResult[] = [];
  let cumTaxable = 0;
  let cumTax = 0;
  for (let m = 1; m <= 12; m++) {
    if (m < cfg.startMonth) {
      results.push({ month: m, employed: false, tax: 0, takeHome: 0 });
      continue;
    }
    cumTaxable += cfg.monthlySalary - insurance - BASIC_DEDUCTION - cfg.specialDeduction;
    const cumTaxDue = cumulativeTax(cumTaxable);
    const tax = cumTaxDue - cumTax;
    cumTax = cumTaxDue;
    results.push({ month: m, employed: true, tax, takeHome: cfg.monthlySalary - insurance - tax });
  }
  return results;
}

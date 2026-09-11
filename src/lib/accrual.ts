import { monthlyInsurance, simulateYear } from './tax';
import type { SalaryConfig } from './tax';
import { isWorkday, workStartOfDay } from './workCalendar';
export type DayStatus = 'working' | 'before-work' | 'after-work' | 'rest-day';
export interface AccrualSnapshot {
  perSecond: number; perHour: number; perDay: number; monthlyTakeHome: number;
  annualTakeHome: number; yearToDate: number; monthEarned: number; todayEarned: number;
  dayProgress: number; status: DayStatus; insurance: number; monthTax: number;
}
// 班次按自然日切片，前一天夜班在午夜之后的部分归入今天。
function intervals(cfg: SalaryConfig, day: Date): [number, number][] {
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  if (cfg.accrualMode === 'always') return [[+start, +end]];
  const result: [number, number][] = [];
  for (const offset of [-1, 0]) {
    const d = new Date(start); d.setDate(d.getDate() + offset);
    if (!isWorkday(cfg, d) || d.getFullYear() < day.getFullYear() || d.getMonth() + 1 < cfg.startMonth) continue;
    const a = +workStartOfDay(cfg, d), b = a + cfg.workHoursPerDay * 3600000;
    if (Math.min(b, +end) > Math.max(a, +start)) result.push([Math.max(a, +start), Math.min(b, +end)]);
  }
  return result;
}
export function snapshot(cfg: SalaryConfig, now: Date): AccrualSnapshot {
  const months = simulateYear(cfg), cur = months[now.getMonth()];
  const count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let total = 0, elapsed = 0, todayTotal = 0, todayElapsed = 0;
  let todayIntervals: [number, number][] = [];
  for (let d = 1; d <= count; d++) {
    const parts = intervals(cfg, new Date(now.getFullYear(), now.getMonth(), d));
    for (const [a, b] of parts) {
      total += b - a;
      elapsed += Math.max(0, Math.min(+now, b) - a);
      if (d === now.getDate()) { todayTotal += b - a; todayElapsed += Math.max(0, Math.min(+now, b) - a); }
    }
    if (d === now.getDate()) todayIntervals = parts;
  }
  const perMs = total ? cur.takeHome / total : 0;
  const active = cur.employed && todayIntervals.some(([a, b]) => +now >= a && +now < b);
  const status: DayStatus = !cur.employed || !todayTotal ? 'rest-day' : active ? 'working' : todayElapsed >= todayTotal ? 'after-work' : 'before-work';
  return {
    perSecond: perMs * 1000, perHour: perMs * 3600000,
    perDay: cfg.accrualMode === 'always' ? cur.takeHome / count : perMs * cfg.workHoursPerDay * 3600000,
    monthlyTakeHome: cur.takeHome, annualTakeHome: months.reduce((s,m) => s + m.takeHome, 0),
    yearToDate: months.slice(0, now.getMonth()).reduce((s,m) => s + m.takeHome, 0) + elapsed * perMs,
    monthEarned: elapsed * perMs, todayEarned: todayElapsed * perMs,
    dayProgress: todayTotal && cur.employed ? todayElapsed / todayTotal : 0, status,
    insurance: cur.employed ? monthlyInsurance(cfg) : 0, monthTax: cur.tax,
  };
}

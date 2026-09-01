import type { SalaryConfig } from './tax';

// ISO 星期：1=周一 … 7=周日
export function isoWeekday(d: Date): number {
  return d.getDay() === 0 ? 7 : d.getDay();
}

export function isWorkday(cfg: SalaryConfig, d: Date): boolean {
  return cfg.workDays.includes(isoWeekday(d));
}

export function workdaysInMonth(cfg: SalaryConfig, year: number, month: number): number {
  const days = new Date(year, month, 0).getDate();
  let n = 0;
  for (let d = 1; d <= days; d++) {
    if (isWorkday(cfg, new Date(year, month - 1, d))) n++;
  }
  return n;
}

export function workStartOfDay(cfg: SalaryConfig, d: Date): Date {
  const [h, m] = cfg.workStart.split(':').map(Number);
  const start = new Date(d);
  start.setHours(h, m, 0, 0);
  return start;
}

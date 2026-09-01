import { monthlyInsurance, simulateYear } from './tax';
import type { SalaryConfig } from './tax';
import { isWorkday, workdaysInMonth, workStartOfDay } from './workCalendar';

export type DayStatus = 'working' | 'before-work' | 'after-work' | 'rest-day';

export interface AccrualSnapshot {
  perSecond: number;
  perHour: number;
  perDay: number;
  monthlyTakeHome: number;
  annualTakeHome: number;
  yearToDate: number;
  todayEarned: number;
  dayProgress: number; // 0..1，工作日内进度（全天候模式为当日进度）
  status: DayStatus;
  insurance: number;
  monthTax: number;
}

function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

export function snapshot(cfg: SalaryConfig, now: Date): AccrualSnapshot {
  const year = now.getFullYear();
  const months = simulateYear(cfg);
  const currentMonth = now.getMonth() + 1;
  const cur = months[currentMonth - 1];
  const annualTakeHome = months.reduce((s, m) => s + m.takeHome, 0);
  const insurance = monthlyInsurance(cfg);
  const base = {
    monthlyTakeHome: cur.takeHome,
    annualTakeHome,
    insurance,
    monthTax: cur.tax,
  };

  if (cfg.accrualMode === 'always') {
    const days = daysInYear(year);
    const perDay = annualTakeHome / days;
    const perSecond = perDay / 86400;
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const elapsedSec = (now.getTime() - startOfDay.getTime()) / 1000;
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.round((startOfDay.getTime() - startOfYear.getTime()) / 86400000) + 1;
    return {
      ...base,
      perSecond,
      perHour: perSecond * 3600,
      perDay,
      yearToDate: perDay * (dayOfYear - 1) + elapsedSec * perSecond,
      todayEarned: elapsedSec * perSecond,
      dayProgress: elapsedSec / 86400,
      status: 'working',
    };
  }

  // 工作时段模式
  const workdays = workdaysInMonth(cfg, year, currentMonth);
  const secondsPerDay = cfg.workHoursPerDay * 3600;
  const perDay = workdays > 0 ? cur.takeHome / workdays : 0;
  const perSecond = secondsPerDay > 0 ? perDay / secondsPerDay : 0;

  const workday = isWorkday(cfg, now);
  const start = workStartOfDay(cfg, now);
  const elapsedSec = (now.getTime() - start.getTime()) / 1000;
  const workedSec = workday ? Math.min(Math.max(elapsedSec, 0), secondsPerDay) : 0;

  let elapsedWorkdays = 0;
  for (let d = 1; d < now.getDate(); d++) {
    if (isWorkday(cfg, new Date(year, currentMonth - 1, d))) elapsedWorkdays++;
  }
  const completedMonths = months.slice(0, currentMonth - 1).reduce((s, m) => s + m.takeHome, 0);

  return {
    ...base,
    perSecond,
    perHour: perSecond * 3600,
    perDay,
    yearToDate: completedMonths + elapsedWorkdays * perDay + workedSec * perSecond,
    todayEarned: workedSec * perSecond,
    dayProgress: workday ? Math.min(Math.max(elapsedSec / secondsPerDay, 0), 1) : 0,
    status: !workday ? 'rest-day' : elapsedSec < 0 ? 'before-work' : elapsedSec >= secondsPerDay ? 'after-work' : 'working',
  };
}

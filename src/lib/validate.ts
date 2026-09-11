import { DEFAULT_CONFIG, monthlyInsurance } from './tax';
import type { SalaryConfig } from './tax';
export function parseConfig(value: unknown): SalaryConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('配置格式不正确');
  const v = value as Partial<SalaryConfig>;
  const c = { ...DEFAULT_CONFIG, ...v, rates: { ...DEFAULT_CONFIG.rates, ...v.rates } };
  const number = (n: unknown, lo: number, hi: number) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
  if (!number(c.monthlySalary, 0, 10000000)) throw new Error('月薪需在 0 至 1000 万元之间');
  if (c.insuranceBase !== null && !number(c.insuranceBase, 0, 10000000)) throw new Error('请检查缴费基数');
  if (!['none', 'shenzhen'].includes(c.city) || !['salary', 'minimum'].includes(c.baseMode)) throw new Error('请选择有效的缴费政策');
  if (Object.keys(c.rates).length !== 4 || Object.values(c.rates).some(n => !number(n, 0, 1))) throw new Error('缴费比例需在 0% 至 100% 之间');
  if (!number(c.specialDeduction, 0, 10000000)) throw new Error('请检查专项附加扣除');
  if (!number(c.startMonth, 1, 12) || !Number.isInteger(c.startMonth)) throw new Error('请检查入职月份');
  if (!['work', 'always'].includes(c.accrualMode)) throw new Error('请选择计薪模式');
  if (!Array.isArray(c.workDays) || !c.workDays.length || c.workDays.some(n => !Number.isInteger(n) || n < 1 || n > 7)) throw new Error('请至少选择一个工作日');
  c.workDays = [...new Set(c.workDays)];
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.workStart) || !number(c.workHoursPerDay, 0.5, 24)) throw new Error('请检查上班时间与每日工时');
  if (monthlyInsurance(c) > c.monthlySalary) throw new Error('个人缴费超过月薪，请检查基数和比例');
  return c;
}

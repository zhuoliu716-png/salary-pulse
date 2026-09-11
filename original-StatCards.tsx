import type { AccrualSnapshot } from '../lib/accrual';
import { formatMoney } from '../lib/format';

export function StatCards({ snap }: { snap: AccrualSnapshot }) {
  const items = [
    { label: '每秒到手', value: `¥ ${snap.perSecond.toFixed(4)}`, accent: true },
    { label: '每小时到手', value: `¥ ${formatMoney(snap.perHour)}` },
    { label: '每日到手', value: `¥ ${formatMoney(snap.perDay)}` },
    { label: '本月到手', value: `¥ ${formatMoney(snap.monthlyTakeHome)}` },
    { label: '全年到手 · 预估', value: `¥ ${formatMoney(snap.annualTakeHome)}` },
    { label: '本年已累计', value: `¥ ${formatMoney(snap.yearToDate)}`, accent: true },
  ];

  return (
    <section className="stats">
      {items.map((item) => (
        <div className={item.accent ? 'card accent' : 'card'} key={item.label}>
          <div className="card-label">{item.label}</div>
          <div className="card-value">{item.value}</div>
        </div>
      ))}
    </section>
  );
}

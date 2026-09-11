import type { AccrualSnapshot } from '../lib/accrual';
import type { SalaryConfig } from '../lib/tax';
import { DayProgress } from './DayProgress';
import { Odometer } from './Odometer';

function statusText(snap: AccrualSnapshot, config: SalaryConfig): string {
  if (config.accrualMode === 'always') return '全天候模式 · 24 小时持续累计';
  switch (snap.status) {
    case 'working':
      return '上班中 · 每一秒都在进账';
    case 'before-work':
      return `还没开工 · ${config.workStart} 开始跳动`;
    case 'after-work':
      return '今日已收工 · 战果已定格';
    case 'rest-day':
      return '今日休息 · 好好生活也是收入';
  }
}

export function HeroCounter({ snap, config }: { snap: AccrualSnapshot; config: SalaryConfig }) {
  return (
    <section className="hero">
      <div className="hero-label">今日到手 · 税后</div>
      <Odometer value={snap.todayEarned} />
      <div className={`hero-status status-${snap.status}`}>
        {snap.status === 'working' && <span className="live-dot" />}
        {statusText(snap, config)}
      </div>
      <DayProgress snap={snap} config={config} />
    </section>
  );
}

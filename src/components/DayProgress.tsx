import type { AccrualSnapshot } from '../lib/accrual';
import type { SalaryConfig } from '../lib/tax';

const R = 26;
const C = 2 * Math.PI * R;

export function DayProgress({ snap, config }: { snap: AccrualSnapshot; config: SalaryConfig }) {
  const progress = snap.dayProgress;
  const label = config.accrualMode === 'work' ? '今日工作进度' : '今日时间进度';

  return (
    <div className="day-progress">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5c86a" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
        </defs>
        <circle className="ring-bg" cx="30" cy="30" r={R} />
        <circle
          className="ring-fg"
          cx="30"
          cy="30"
          r={R}
          stroke="url(#ring-grad)"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          transform="rotate(-90 30 30)"
        />
      </svg>
      <div className="dp-text">
        <div className="dp-pct">{Math.round(progress * 100)}%</div>
        <div className="dp-label">{label}</div>
      </div>
    </div>
  );
}

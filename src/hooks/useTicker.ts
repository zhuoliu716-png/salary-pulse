import { useEffect, useState } from 'react';
import { snapshot } from '../lib/accrual';
import type { SalaryConfig } from '../lib/tax';
export function useTicker(config: SalaryConfig) {
  const [snap, setSnap] = useState(() => snapshot(config, new Date()));
  useEffect(() => {
    const tick = () => { if (!document.hidden) setSnap(snapshot(config, new Date())); };
    tick();
    const timer = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [config]);
  return snap;
}

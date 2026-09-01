import { useEffect, useState } from 'react';
import { snapshot } from '../lib/accrual';
import type { AccrualSnapshot } from '../lib/accrual';
import type { SalaryConfig } from '../lib/tax';

export function useTicker(config: SalaryConfig): AccrualSnapshot {
  const [snap, setSnap] = useState<AccrualSnapshot>(() => snapshot(config, new Date()));

  useEffect(() => {
    let raf: number;
    const loop = () => {
      setSnap(snapshot(config, new Date()));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [config]);

  return snap;
}

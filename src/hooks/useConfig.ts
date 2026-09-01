import { useCallback, useEffect, useState } from 'react';
import { configUrl, decodeConfigHash } from '../lib/configUrl';
import { DEFAULT_CONFIG } from '../lib/tax';
import type { SalaryConfig } from '../lib/tax';

const KEY = 'salary-pulse:config:v1';

function load(): SalaryConfig {
  const fromUrl = decodeConfigHash(location.hash);
  if (fromUrl) return fromUrl;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed, rates: { ...DEFAULT_CONFIG.rates, ...parsed.rates } };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useConfig() {
  const [config, setConfig] = useState<SalaryConfig>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(config));
    history.replaceState(null, '', configUrl(config));
  }, [config]);

  const update = useCallback((patch: Partial<SalaryConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
  }, []);

  return { config, update, shareUrl: configUrl(config) };
}

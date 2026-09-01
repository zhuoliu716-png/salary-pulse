import { DEFAULT_CONFIG } from './tax';
import type { SalaryConfig } from './tax';

// 配置编码进 URL fragment，绕过 iOS 主屏幕模式 localStorage 不持久的问题
export function encodeConfig(cfg: SalaryConfig): string {
  const json = JSON.stringify(cfg);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeConfigHash(hash: string): SalaryConfig | null {
  const m = /#c=([A-Za-z0-9_-]+)/.exec(hash);
  if (!m) return null;
  try {
    let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const parsed = JSON.parse(decodeURIComponent(escape(atob(b64))));
    return { ...DEFAULT_CONFIG, ...parsed, rates: { ...DEFAULT_CONFIG.rates, ...parsed.rates } };
  } catch {
    return null;
  }
}

export function configUrl(cfg: SalaryConfig): string {
  return `${location.origin}${location.pathname}#c=${encodeConfig(cfg)}`;
}

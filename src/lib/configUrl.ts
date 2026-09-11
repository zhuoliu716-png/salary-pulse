import { parseConfig } from './validate';
import type { SalaryConfig } from './tax';

// 兼容旧版配置链接；新版不再自动将薪酬写入 URL。
export function decodeConfigHash(hash: string): SalaryConfig | null {
  const m = /#c=([A-Za-z0-9_-]+)/.exec(hash);
  if (!m) return null;
  try {
    let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const parsed = JSON.parse(decodeURIComponent(escape(atob(b64))));
    return parseConfig(parsed);
  } catch {
    return null;
  }
}

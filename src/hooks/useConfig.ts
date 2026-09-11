import { useState } from 'react';
import { decodeConfigHash } from '../lib/configUrl';
import { DEFAULT_CONFIG } from '../lib/tax';
import type { SalaryConfig } from '../lib/tax';
import { parseConfig } from '../lib/validate';
export const KEY = 'salary-pulse:config:v1';
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { config: parseConfig(JSON.parse(raw)), ready: true, message: '已读取本机设置' };
    const legacy = decodeConfigHash(location.hash);
    if (legacy) {
      const config = parseConfig(legacy);
      localStorage.setItem(KEY, JSON.stringify(config));
      return { config, ready: true, message: '旧链接设置已保存到本机' };
    }
    return { config: { ...DEFAULT_CONFIG, city: 'none' }, ready: false, message: '' };
  } catch {
    return { config: { ...DEFAULT_CONFIG, city: 'none' }, ready: false, message: '旧设置无法读取，原数据未被覆盖。可从备份恢复。' };
  }
}
export function useConfig() {
  const [state, setState] = useState(load);
  function save(value: SalaryConfig) {
    const config = parseConfig(value);
    const json = JSON.stringify(config);
    try {
      const previous = localStorage.getItem(KEY);
      if (previous) localStorage.setItem(KEY + ':previous', previous);
      localStorage.setItem(KEY, json);
      if (localStorage.getItem(KEY) !== json) throw new Error('readback');
    } catch {
      throw new Error('本机保存失败，请检查浏览器存储权限或空间。当前修改尚未确认保存。');
    }
    history.replaceState(null, '', location.pathname + location.search);
    setState({ config, ready: true, message: '已保存到本机' });
    navigator.storage?.persist?.().catch(() => {});
  }
  return { ...state, save };
}

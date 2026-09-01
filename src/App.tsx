import { useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { HeroCounter } from './components/HeroCounter';
import { StatCards } from './components/StatCards';
import { useConfig } from './hooks/useConfig';
import { useTicker } from './hooks/useTicker';

export default function App() {
  const { config, update, shareUrl } = useConfig();
  const snap = useTicker(config);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="app">
      <div className="glow g1" />
      <div className="glow g2" />

      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">薪水跳动</span>
          <span className="brand-sub">SALARY PULSE · 实时税后收入</span>
        </div>
        <button className="icon-btn" onClick={() => setPanelOpen(true)} aria-label="设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
          </svg>
        </button>
      </header>

      <main className="content">
        <HeroCounter snap={snap} config={config} />
        <StatCards snap={snap} />
        <footer className="footnote">按中国个人所得税「累计预扣预缴」估算 · 配置存本机或随专属链接携带 · 仅供个人参考</footer>
      </main>

      <ConfigPanel open={panelOpen} onClose={() => setPanelOpen(false)} config={config} update={update} shareUrl={shareUrl} />
    </div>
  );
}

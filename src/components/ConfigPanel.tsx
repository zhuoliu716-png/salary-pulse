import { useState } from 'react';
import { monthlyInsurance, simulateYear, insuranceBreakdown } from '../lib/tax';
import type { InsuranceRates, SalaryConfig } from '../lib/tax';
import { CITY_POLICIES, getPolicy } from '../lib/policy';
import { formatMoney } from '../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  config: SalaryConfig;
  update: (patch: Partial<SalaryConfig>) => void;
  shareUrl: string;
}

const WEEKDAYS = [
  { iso: 1, label: '一' },
  { iso: 2, label: '二' },
  { iso: 3, label: '三' },
  { iso: 4, label: '四' },
  { iso: 5, label: '五' },
  { iso: 6, label: '六' },
  { iso: 7, label: '日' },
];

const RATE_FIELDS: { key: keyof InsuranceRates; label: string }[] = [
  { key: 'pension', label: '养老保险' },
  { key: 'medical', label: '医疗保险' },
  { key: 'unemployment', label: '失业保险' },
  { key: 'housingFund', label: '住房公积金' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {children}
    </div>
  );
}

export function ConfigPanel({ open, onClose, config, update, shareUrl }: Props) {
  const months = simulateYear(config);
  const cur = months[new Date().getMonth()];
  const insurance = monthlyInsurance(config);
  const rows = insuranceBreakdown(config);
  const [copied, setCopied] = useState(false);

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('自动复制失败，请手动长按复制：', shareUrl);
    }
  };

  const toggleWorkday = (iso: number) => {
    const days = config.workDays.includes(iso)
      ? config.workDays.filter((d) => d !== iso)
      : [...config.workDays, iso];
    update({ workDays: days });
  };

  return (
    <>
      <div className={open ? 'drawer-backdrop open' : 'drawer-backdrop'} onClick={onClose} />
      <aside className={open ? 'drawer open' : 'drawer'}>
        <div className="drawer-head">
          <h2>薪酬设置</h2>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <Section title="专属链接">
          <button className="share-btn" onClick={copyShareUrl}>
            {copied ? '已复制 ✓' : '复制携带配置的专属链接'}
          </button>
          <p className="share-hint">
            配置已编码进链接。iPhone 桌面图标若记不住配置，用此链接重新「添加到主屏幕」，以后打开即自带你的参数；换设备打开同一链接也自动带上配置。链接含你的薪酬信息，仅发给自己。
          </p>
        </Section>

        <Section title="收入">
          <Field label="税前月薪（元）">
            <input
              type="number"
              min={0}
              value={config.monthlySalary || ''}
              onChange={(e) => update({ monthlySalary: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>
        </Section>

        <Section title="五险一金（个人缴纳）">
          <Field label="城市政策">
            <select value={config.city} onChange={(e) => update({ city: e.target.value })}>
              {CITY_POLICIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <p className="share-hint">{getPolicy(config.city).note}</p>
          {getPolicy(config.city).id !== 'none' && (
            <div className="mode-row">
              <div className="segmented">
                <button
                  className={config.baseMode === 'salary' ? 'active' : ''}
                  onClick={() => update({ baseMode: 'salary' })}
                >
                  按实际工资
                </button>
                <button
                  className={config.baseMode === 'minimum' ? 'active' : ''}
                  onClick={() => update({ baseMode: 'minimum' })}
                >
                  按最低标准
                </button>
              </div>
            </div>
          )}
          {config.baseMode === 'salary' && (
            <Field label="缴费基数（元，留空 = 跟随月薪；按城市政策自动封顶保底）">
              <input
                type="number"
                min={0}
                value={config.insuranceBase ?? ''}
                placeholder={`跟随月薪 · 当前 ${formatMoney(config.monthlySalary)}`}
                onChange={(e) =>
                  update({ insuranceBase: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })
                }
              />
            </Field>
          )}
          <div className="rate-grid">
            {RATE_FIELDS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <div className="suffix-wrap">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={+(config.rates[key] * 100).toFixed(2)}
                    onChange={(e) =>
                      update({
                        rates: { ...config.rates, [key]: Math.round((Number(e.target.value) || 0) * 100) / 10000 },
                      })
                    }
                  />
                  <span className="suffix">%</span>
                </div>
              </Field>
            ))}
          </div>
        </Section>

        <Section title="个税">
          <Field label="专项附加扣除（元/月，子女教育、房贷等合计）">
            <input
              type="number"
              min={0}
              value={config.specialDeduction || ''}
              onChange={(e) => update({ specialDeduction: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>
          <Field label="入职月份（影响累计预扣预缴起点）">
            <select
              value={config.startMonth}
              onChange={(e) => update({ startMonth: Number(e.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} 月
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="计薪口径">
          <div className="segmented">
            <button
              className={config.accrualMode === 'work' ? 'active' : ''}
              onClick={() => update({ accrualMode: 'work' })}
            >
              仅工作时段
            </button>
            <button
              className={config.accrualMode === 'always' ? 'active' : ''}
              onClick={() => update({ accrualMode: 'always' })}
            >
              全天候 24 小时
            </button>
          </div>
          {config.accrualMode === 'work' && (
            <div className="work-settings">
              <Field label="工作日">
                <div className="weekdays">
                  {WEEKDAYS.map(({ iso, label }) => (
                    <button
                      key={iso}
                      className={config.workDays.includes(iso) ? 'weekday active' : 'weekday'}
                      onClick={() => toggleWorkday(iso)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="rate-grid">
                <Field label="上班时间">
                  <input
                    type="time"
                    value={config.workStart}
                    onChange={(e) => e.target.value && update({ workStart: e.target.value })}
                  />
                </Field>
                <Field label="每日工时（小时）">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    step={0.5}
                    value={config.workHoursPerDay || ''}
                    onChange={(e) =>
                      update({ workHoursPerDay: Math.min(24, Math.max(1, Number(e.target.value) || 8)) })
                    }
                  />
                </Field>
              </div>
            </div>
          )}
        </Section>

        <Section title={`当月明细（${new Date().getMonth() + 1} 月）`}>
          <div className="breakdown">
            <div className="bd-row">
              <span>税前月薪</span>
              <span>¥ {formatMoney(config.monthlySalary)}</span>
            </div>
            {rows.map((r) => (
              <div className="bd-row" key={r.key}>
                <span>
                  {r.label} · 基数 {formatMoney(r.base)}
                  {r.clamped ? '（已调整）' : ''}
                </span>
                <span>− ¥ {formatMoney(r.amount)}</span>
              </div>
            ))}
            <div className="bd-row">
              <span>五险一金合计</span>
              <span>− ¥ {formatMoney(insurance)}</span>
            </div>
            <div className="bd-row">
              <span>个税 · 累计预扣</span>
              <span>− ¥ {formatMoney(cur.tax)}</span>
            </div>
            <div className="bd-row total">
              <span>到手</span>
              <span>¥ {formatMoney(cur.takeHome)}</span>
            </div>
          </div>
        </Section>
      </aside>
    </>
  );
}

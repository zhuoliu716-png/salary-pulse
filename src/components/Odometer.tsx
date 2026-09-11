import { memo, useEffect, useRef, useState } from 'react';

const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function reenable(setAnimated: (b: boolean) => void) {
  requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
}

// 单个数字位：0-9 双份数字带，永远向前滚动；9→0 走第二份 0，落定后无感复位
const RollingDigit = memo(function RollingDigit({ digit }: { digit: number }) {
  const [virtual, setVirtual] = useState(digit);
  const [animated, setAnimated] = useState(true);
  const virtualRef = useRef(digit);
  const prevRef = useRef(digit);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = digit;
    const diff = (digit - prev + 10) % 10;
    if (diff === 0) return;
    if (diff <= 5 && virtualRef.current + diff < 20) {
      virtualRef.current += diff;
      setVirtual(virtualRef.current);
    } else {
      // 数值回退（如跨天清零、改配置）或滚带将越界：直接快照到位
      setAnimated(false);
      virtualRef.current = digit;
      setVirtual(digit);
      reenable(setAnimated);
    }
  }, [digit]);

  return (
    <span
      className="od-digit"
      onTransitionEnd={(e) => {
        if (e.propertyName !== 'transform' || virtualRef.current < 10) return;
        setAnimated(false);
        virtualRef.current -= 10;
        setVirtual(virtualRef.current);
        reenable(setAnimated);
      }}
    >
      <span
        className={animated ? 'od-strip' : 'od-strip od-strip--static'}
        style={{ transform: `translateY(-${virtual}em)` }}
      >
        {STRIP.map((d, i) => (
          <span className="od-cell" key={i}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
});

interface OdometerProps {
  value: number;
  decimals?: number; // 大号滚动的小数位
  fracDigits?: number; // 更小更暗、随帧快速流动的尾数
}

export function Odometer({ value, decimals = 2, fracDigits = 2 }: OdometerProps) {
  const fixed = Math.max(0, value).toFixed(decimals + fracDigits);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const bigDec = decPart.slice(0, decimals);
  const frac = decPart.slice(decimals);

  return (
    <div className="odometer" role="img" aria-label={`人民币 ${fixed} 元`}>
      <span className="od-currency" aria-hidden="true">¥</span>
      <span className="od-main" aria-hidden="true">
        {[...grouped].map((ch, i) =>
          /\d/.test(ch) ? (
            <RollingDigit key={`i${grouped.length - i}`} digit={+ch} />
          ) : (
            <span className="od-sep" key={`s${i}`}>
              {ch}
            </span>
          ),
        )}
        <span className="od-dot">.</span>
        {[...bigDec].map((ch, i) => (
          <RollingDigit key={`d${i}`} digit={+ch} />
        ))}
      </span>
      {frac && <span className="od-frac" aria-hidden="true">{frac}</span>}
    </div>
  );
}

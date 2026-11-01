import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { C, EASE } from './shared';

const ROWS = [
  { at: 0.2, label: 'COST PER SESSION', target: 0.022, fmt: (v: number) => `$${v.toFixed(3)}`, left: '6%', top: '10%' },
  { at: 1.5, label: 'END TO END', target: 28, fmt: (v: number) => `${Math.round(v)}s`, left: '46%', top: '36%' },
  { at: 2.8, label: 'LLM CALLS PER RUN', target: 11, fmt: (v: number) => `~${Math.round(v)}`, left: '14%', top: '62%' },
];
const N = 16;

export function Scene5() {
  const [vals, setVals] = useState([0, 0, 0]);
  const events = ROWS.flatMap((r, ri) =>
    Array.from({ length: N }, (_, i) => ({
      time: Math.round(r.at * 1000 + i * 40),
      callback: () => setVals((prev) => prev.map((pv, k) => (k === ri ? r.target * ((i + 1) / N) : pv))),
    })),
  );
  useSceneTimer(events);
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden grain"
      style={{ background: C.ink }}
      initial={{ clipPath: 'inset(50% 0 50% 0)' }}
      animate={{ clipPath: 'inset(0% 0 0% 0)' }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.3 } }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {ROWS.map((r, i) => (
        <motion.div
          key={r.label}
          className="absolute"
          style={{ left: r.left, top: r.top }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: [0, 1, 1, 0], y: [40, 0, 0, i % 2 ? 80 : -80] }}
          transition={{ duration: 5.5, times: [r.at / 5.5, (r.at + 0.4) / 5.5, 4.7 / 5.5, 1], ease: 'easeInOut' }}
        >
          <div className="f-mono" style={{ fontSize: '2vmin', color: C.ember, letterSpacing: '0.3em' }}>{r.label}</div>
          <div className="f-display tabular-nums" style={{ fontSize: '20vmin', lineHeight: 0.95, color: C.cream, fontWeight: 300 }}>
            {r.fmt(vals[i])}
          </div>
          <motion.div
            style={{ height: '0.35vmin', background: C.brass, transformOrigin: 'left' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: r.at + 0.5, duration: 0.6, ease: EASE }}
          />
        </motion.div>
      ))}
      <motion.div
        className="absolute f-display italic"
        style={{ right: '6%', bottom: '10%', fontSize: '3.4vmin', color: C.soft, textAlign: 'right' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 5.5, times: [0.7, 0.76, 0.9, 1] }}
      >
        Instrumented from day one.
      </motion.div>
    </motion.section>
  );
}

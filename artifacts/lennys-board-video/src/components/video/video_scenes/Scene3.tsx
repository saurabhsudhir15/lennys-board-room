import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { C, EASE } from './shared';

const STEPS = [
  ['01', 'Analyze', 'gpt-4o-mini'],
  ['02', 'Retrieve', 'pgvector · top-10'],
  ['03', 'Select board', 'gpt-4o-mini'],
  ['04', 'Generate responses', '×5 parallel'],
  ['05', 'Debate', 'parallel'],
  ['06', 'Synthesis', 'parallel · gpt-4o'],
  ['07', "Lenny's insight", 'parallel · gpt-4o'],
  ['08', 'Pick your move', 'gpt-4o'],
];
// light-up times (s); 5-7 together
const LIGHT = [0.2, 0.6, 1.0, 2.2, 2.65, 2.65, 2.65, 3.1];
const CLOCK = Array.from({ length: 70 }, (_, i) => ({ t: 200 + i * 50, v: ((i + 1) / 70) * 28 }));

export function Scene3() {
  const [v, setV] = useState(0);
  useSceneTimer(CLOCK.map((c) => ({ time: c.t, callback: () => setV(c.v) })));
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden grain"
      style={{ background: C.ink }}
      initial={{ opacity: 0, scale: 1.4, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: '-6vh', transition: { duration: 0.4 } }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="absolute f-mono" style={{ left: '6%', top: '8%', fontSize: '2vmin', color: C.ember, letterSpacing: '0.3em' }}>
        THE 8-STEP PIPELINE
      </div>
      <div className="absolute" style={{ left: '6%', top: '15%', width: '42%' }}>
        {STEPS.map(([n, name, tag], i) => (
          <motion.div
            key={n}
            className="flex items-center"
            style={{ height: '8.6vmin', borderBottom: '1px solid #2c241e', gap: '2.4vmin' }}
            initial={{ opacity: 0.2, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: LIGHT[i], duration: 0.35, ease: EASE }}
          >
            <motion.span
              className="f-mono"
              style={{ fontSize: '2.2vmin', width: '4vmin' }}
              initial={{ color: C.muted }}
              animate={{ color: C.ember }}
              transition={{ delay: LIGHT[i] }}
            >
              {n}
            </motion.span>
            <span className="f-display" style={{ fontSize: '4.2vmin', color: C.cream, flex: 1 }}>{name}</span>
            <span className="f-mono" style={{ fontSize: '1.9vmin', color: C.soft }}>{tag}</span>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="absolute rounded-[1vmin] f-mono"
        style={{ left: '51%', top: '30%', padding: '1.6vmin 2.4vmin', background: '#3a1a10', border: `1px solid ${C.ember}`, color: C.cream, fontSize: '2.4vmin' }}
        initial={{ opacity: 0, x: -30, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 1.3, type: 'spring', stiffness: 260, damping: 20 }}
      >
        ← select_board · 13s · <span style={{ color: C.ember }}>46% of latency</span>
        <div style={{ marginTop: '1.2vmin', height: '1.2vmin', background: '#2c241e', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', width: '46%', background: C.ember, transformOrigin: 'left' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.6, duration: 0.8, ease: EASE }}
          />
        </div>
      </motion.div>
      <div className="absolute text-right" style={{ right: '6%', bottom: '12%' }}>
        <div className="f-mono" style={{ fontSize: '2vmin', color: C.soft, letterSpacing: '0.2em' }}>END-TO-END</div>
        <div className="f-mono tabular-nums" style={{ fontSize: '24vmin', lineHeight: 0.9, color: C.cream, fontWeight: 500 }}>
          {v.toFixed(1)}
          <span style={{ color: C.ember, fontSize: '10vmin' }}>s</span>
        </div>
      </div>
    </motion.section>
  );
}

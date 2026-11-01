import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { C, EASE } from './shared';

const PROMPT =
  "We're a B2B product with 3 enterprise customers who want deep customisation and 200 SMB customers who need simplicity. Enterprise deals are 10x the ACV. What do I do?";
const STEPS = Array.from({ length: 44 }, (_, i) => ({ t: 400 + i * 50, n: Math.round(((i + 1) / 44) * PROMPT.length) }));

export function Scene1() {
  const [n, setN] = useState(0);
  useSceneTimer(STEPS.map((s) => ({ time: s.t, callback: () => setN(s.n) })));
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden grain"
      style={{ background: C.ink }}
      exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.25 } }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${C.ink2} 1px, transparent 1px), linear-gradient(90deg, ${C.ink2} 1px, transparent 1px)`,
          backgroundSize: '6vmin 6vmin',
          opacity: 0.6,
        }}
      />
      <motion.div
        className="absolute f-mono tracking-[0.3em]"
        style={{ left: '6%', top: '9%', fontSize: '2vmin', color: C.ember }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
      >
        BRING YOUR TOUGHEST PM PROBLEM
      </motion.div>
      <motion.h1
        className="absolute f-display italic m-0"
        style={{ left: '6%', top: '17%', fontSize: '10vmin', color: C.cream, fontWeight: 400, lineHeight: 1 }}
        initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 2.6, duration: 0.6, ease: EASE }}
      >
        Who do you <span style={{ color: C.ember }}>ask?</span>
      </motion.h1>
      <motion.div
        className="absolute rounded-[2vmin] border"
        style={{
          left: '19%', width: '62%', top: '42%',
          background: C.ink2, borderColor: '#3a2f27', padding: '3.5vmin 4vmin',
        }}
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{
          opacity: [0, 1, 1, 0], scale: [0.92, 1, 1, 0.04], y: [30, 0, 0, -20],
          borderRadius: ['2vmin', '2vmin', '2vmin', '50vmin'],
        }}
        transition={{ duration: 4.3, times: [0, 0.08, 0.8, 1], ease: 'easeInOut' }}
      >
        <div className="f-mono" style={{ fontSize: '1.9vmin', color: C.muted, marginBottom: '1.6vmin' }}>
          problem.txt
        </div>
        <div style={{ fontSize: '3.2vmin', color: C.cream, lineHeight: 1.4, minHeight: '13.5vmin' }}>
          {PROMPT.slice(0, n)}
          <motion.span
            style={{ display: 'inline-block', width: '0.5ch', background: C.ember, marginLeft: 2 }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            &nbsp;
          </motion.span>
        </div>
      </motion.div>
      <motion.div
        className="absolute rounded-full"
        style={{ left: '50%', top: '50%', width: '6vmin', height: '6vmin', marginLeft: '-3vmin', marginTop: '-3vmin', background: C.ember }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 0, 1] }}
        transition={{ duration: 4.3, times: [0, 0.9, 1], ease: EASE }}
      />
    </motion.section>
  );
}

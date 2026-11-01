import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { C, EASE, img } from './shared';

const SHOTS = [
  { file: 'lenny-landing.png', x: -62, cap: 'Describe the problem. Hit assemble.' },
  { file: 'lenny-debate.png', x: 0, cap: 'The two most opposed members debate it out.' },
  { file: 'lenny-synthesis.png', x: 62, cap: "Synthesis, tension, and Lenny's insight." },
];
const POSES = [
  { x: 62 * 1.25, s: 1.25, blur: 0 },
  { x: 0, s: 1.25, blur: 0 },
  { x: -62 * 1.25, s: 1.25, blur: 0 },
  { x: 0, s: 0.55, blur: 0 },
];

export function Scene4() {
  const [p, setP] = useState(0);
  useSceneTimer([
    { time: 2200, callback: () => setP(1) },
    { time: 4300, callback: () => setP(2) },
    { time: 6000, callback: () => setP(3) },
  ]);
  const pose = POSES[p];
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      style={{ background: C.ink, perspective: '1600px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(60% 60% at 50% 45%, #3a1a10 0%, ${C.ink} 70%)` }}
      />
      <motion.div
        className="absolute"
        style={{ left: '50%', top: '47%', width: 0, height: 0 }}
        initial={{ x: '77vw', scale: 1.6, rotateY: -8 }}
        animate={{
          x: `${pose.x}vw`, scale: pose.s, rotateY: p === 3 ? 0 : -4,
          filter: p > 0 && p < 3 ? ['blur(0px)', 'blur(10px)', 'blur(0px)'] : 'blur(0px)',
        }}
        transition={{ duration: p === 3 ? 1.0 : 0.55, ease: [0.7, 0, 0.3, 1] }}
      >
        {SHOTS.map((s) => (
          <div
            key={s.file}
            className="absolute overflow-hidden"
            style={{
              left: `${s.x - 27}vw`, top: '-17.6vw', width: '54vw', height: '35.2vw',
              borderRadius: '1vw', border: '1px solid #3a2f27', boxShadow: '0 4vmin 8vmin rgba(0,0,0,.55)',
            }}
          >
            <img src={s.file ? img(s.file) : ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          </div>
        ))}
      </motion.div>
      <div className="absolute" style={{ left: '6%', bottom: '8%', right: '6%', height: '7vmin' }}>
        <AnimatePresence mode="sync">
          <motion.div
            key={p}
            className="absolute inset-0 flex items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14, transition: { duration: 0.2 } }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.2 }}
          >
            <span
              className="f-mono"
              style={{ fontSize: '2vmin', background: C.ember, color: C.ink, padding: '0.8vmin 1.4vmin', marginRight: '2vmin', fontWeight: 600 }}
            >
              {p < 3 ? `0${p + 1}/03` : 'LIVE'}
            </span>
            <span className="f-display italic" style={{ fontSize: '4.4vmin', color: C.cream }}>
              {p < 3 ? SHOTS[p].cap : 'The real product, running on Replit.'}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

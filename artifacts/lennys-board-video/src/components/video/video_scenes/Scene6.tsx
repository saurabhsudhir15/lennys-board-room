import { motion } from 'framer-motion';
import { C, EASE } from './shared';

const BETS = [
  { tag: 'BOLD STRUCTURAL MOVE', title: 'Split into two product lines', by: 'Backed by the Visionary', rot: -6, x: -30 },
  { tag: 'EXECUTION-FIRST MOVE', title: 'Ship tiered enhancements', by: 'Backed by the Operator', rot: 0, x: 0 },
  { tag: 'REFRAME MOVE', title: 'Segment by real usage data', by: 'Backed by the Data Oracle', rot: 6, x: 30 },
];

export function Scene6() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      style={{ background: C.cream }}
      initial={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
      animate={{ clipPath: 'polygon(0 0, 130% 0, 100% 100%, 0 100%)' }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.2 } }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <motion.div
        className="absolute f-display"
        style={{ left: '6%', top: '8%', fontSize: '9vmin', color: C.ink, lineHeight: 1 }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: [0, 1, 1, 0], y: [30, 0, 0, 0] }}
        transition={{ duration: 4, times: [0.05, 0.15, 0.8, 0.9] }}
      >
        Pick your <span className="italic" style={{ color: C.ember }}>move.</span>
      </motion.div>
      <div className="absolute" style={{ left: '50%', top: '62%', width: 0, height: 0 }}>
        {BETS.map((b, i) => (
          <motion.div
            key={b.tag}
            className="absolute rounded-[1.6vmin]"
            style={{ width: '38vmin', height: '40vmin', left: '-19vmin', top: '-20vmin', background: C.ink, padding: '3.4vmin', color: C.cream }}
            initial={{ y: '60vh', rotate: 0, x: `${b.x}vw` }}
            animate={{
              y: ['60vh', '0vh', '0vh', '0vh'],
              x: [`${b.x}vw`, `${b.x}vw`, `${b.x}vw`, '0vw'],
              rotate: [0, b.rot, b.rot, 0],
              scale: [1, 1, 1, 0.08],
              borderRadius: ['1.6vmin', '1.6vmin', '1.6vmin', '30vmin'],
            }}
            transition={{ duration: 4, times: [0.1 + i * 0.1, 0.25 + i * 0.1, 0.8, 0.98], ease: 'easeInOut' }}
          >
            <div className="f-mono" style={{ fontSize: '1.9vmin', color: C.ember, letterSpacing: '0.15em' }}>{b.tag}</div>
            <div className="f-display" style={{ fontSize: '4.6vmin', lineHeight: 1.1, marginTop: '2.4vmin' }}>{b.title}</div>
            <div style={{ position: 'absolute', bottom: '3.4vmin', left: '3.4vmin', fontSize: '2.1vmin', color: C.brass }}>{b.by}</div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

import { motion } from 'framer-motion';
import { C, EASE, ROLES } from './shared';

const R = 30; // vmin ring radius

export function Scene2() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden grain"
      style={{ background: C.ink }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <motion.div
        className="absolute"
        style={{ left: '64%', top: '50%', width: 0, height: 0 }}
        initial={{ x: '-14vw' }}
        animate={{ x: ['-14vw', '-14vw', '0vw', '0vw', '0vw'], scale: [1, 1, 1, 1, 2.6], rotate: [0, 0, 0, 0, 30], opacity: [1, 1, 1, 1, 0], filter: ['blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(12px)'] }}
        transition={{ duration: 5.2, times: [0, 0.4, 0.55, 0.8, 1], ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute rounded-full border"
          style={{ width: `${R * 2}vmin`, height: `${R * 2}vmin`, left: `${-R}vmin`, top: `${-R}vmin`, borderColor: '#3a2f27' }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: '6vmin', height: '6vmin', left: '-3vmin', top: '-3vmin', background: C.ember }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        {ROLES.map((r, i) => {
          const a = (-90 + i * 72) * (Math.PI / 180);
          const x = Math.cos(a) * R;
          const y = Math.sin(a) * R;
          return (
            <motion.div
              key={r.role}
              className="absolute flex flex-col items-center"
              style={{ left: `${x}vmin`, top: `${y}vmin`, width: '22vmin', marginLeft: '-11vmin', marginTop: '-5.5vmin' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.42, type: 'spring', stiffness: 280, damping: 18 }}
            >
              <div
                className="rounded-full flex items-center justify-center f-mono"
                style={{ width: '11vmin', height: '11vmin', background: C.ink2, border: `0.4vmin solid ${i === 0 ? C.ember : C.brass}`, color: C.cream, fontSize: '3.4vmin', fontWeight: 600 }}
              >
                {r.short}
              </div>
              <div className="f-mono text-center" style={{ marginTop: '1.2vmin', fontSize: '2vmin', color: C.cream, letterSpacing: '0.08em' }}>
                {r.role.toUpperCase()}
              </div>
              <div className="text-center" style={{ fontSize: '1.9vmin', color: C.soft }}>{r.line}</div>
            </motion.div>
          );
        })}
      </motion.div>
      <motion.div
        className="absolute"
        style={{ left: '6%', top: '30%', width: '34%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 5.2, times: [0, 0.5, 0.58, 0.85, 0.95] }}
      >
        <div className="f-display" style={{ fontSize: '9vmin', lineHeight: 1, color: C.cream }}>
          Five guests.
          <br />
          <span className="italic" style={{ color: C.ember }}>Five roles.</span>
        </div>
        <motion.div
          style={{ height: '0.3vmin', background: C.brass, margin: '3vmin 0', transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 3.2, duration: 0.6, ease: EASE }}
        />
        <motion.div
          style={{ fontSize: '3vmin', color: C.soft, lineHeight: 1.35 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.4, duration: 0.5 }}
        >
          Pulled by vector search from 50 podcast transcripts and 2,178 chunks.
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

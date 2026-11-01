import { motion } from 'framer-motion';
import { C, EASE } from './shared';

const WORDS = ["Lenny's", 'Board', 'Room'];

export function Scene7() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden grain flex flex-col items-center justify-center"
      style={{ background: C.ink }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 4, times: [0, 0.06, 0.85, 1] }}
    >
      <div className="f-display flex items-baseline" style={{ fontSize: '13vmin', color: C.cream, lineHeight: 1, gap: '3vmin' }}>
        {WORDS.map((w, i) => (
          <span key={w} style={{ overflow: 'hidden', display: 'inline-block', paddingBottom: '2vmin' }}>
            <motion.span
              style={{ display: 'inline-block', fontStyle: i === 1 ? 'italic' : 'normal' }}
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ delay: 0.25 + i * 0.15, duration: 0.7, ease: EASE }}
            >
              {w}
            </motion.span>
          </span>
        ))}
        <motion.span
          className="rounded-full"
          style={{ width: '3vmin', height: '3vmin', background: C.ember, display: 'inline-block', marginLeft: '-2vmin' }}
          initial={{ scale: 6, y: '-10vmin', opacity: 0.6 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 240, damping: 16 }}
        />
      </div>
      <motion.div
        style={{ fontSize: '3.2vmin', color: C.soft, marginTop: '2vmin' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        Your board of advisors. Assembled from the best.
      </motion.div>
      <motion.div
        className="f-mono"
        style={{ fontSize: '1.9vmin', color: C.muted, marginTop: '5vmin', letterSpacing: '0.18em' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        REACT · FASTAPI · SUPABASE PGVECTOR · GPT-4O · LENNY × REPLIT BUILDATHON
      </motion.div>
    </motion.section>
  );
}

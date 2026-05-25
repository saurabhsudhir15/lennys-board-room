import { useEffect, useState } from "react";

const MESSAGES = [
  "Searching Lenny's archive...",
  "Assembling your board...",
  "Board members reviewing your problem...",
  "Debate breaking out...",
  "Synthesizing insights...",
];

const STEP_MS = 4500;

export function CampfireLoading() {
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, STEP_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 80);
    return () => clearInterval(t);
  }, []);

  // progress: smooth across all steps, caps at ~96% so it never looks "done" before data lands
  const total = MESSAGES.length * STEP_MS;
  const progress = Math.min(96, (elapsed / total) * 100);

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6">
      {/* Ambient ember glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,53,0.18) 0%, rgba(245,158,11,0.06) 35%, transparent 70%)",
          filter: "blur(10px)",
          animation: "ember-breathe 4s ease-in-out infinite",
        }}
      />

      {/* Orbiting embers around a glowing core */}
      <div className="relative mb-14 h-40 w-40">
        {/* Core */}
        <div
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #FFD89B 0%, #FF6B35 45%, #B23A12 80%, transparent 100%)",
            boxShadow:
              "0 0 40px rgba(255,107,53,0.7), 0 0 80px rgba(245,158,11,0.35), inset 0 0 20px rgba(255,216,155,0.4)",
            animation: "core-flicker 1.8s ease-in-out infinite",
          }}
        />
        {/* Rotating orbit rings */}
        {[
          { size: 110, dur: "6s", dir: 1, dot: 5, color: "#FF6B35" },
          { size: 140, dur: "9s", dir: -1, dot: 4, color: "#F59E0B" },
          { size: 160, dur: "13s", dir: 1, dot: 3, color: "#FFD89B" },
        ].map((o, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: o.size,
              height: o.size,
              marginLeft: -o.size / 2,
              marginTop: -o.size / 2,
              border: "1px dashed rgba(255,107,53,0.12)",
              animation: `orbit-spin ${o.dur} linear infinite ${o.dir < 0 ? "reverse" : ""}`,
            }}
          >
            <span
              className="absolute"
              style={{
                left: "50%",
                top: 0,
                width: o.dot,
                height: o.dot,
                marginLeft: -o.dot / 2,
                marginTop: -o.dot / 2,
                borderRadius: "50%",
                background: o.color,
                boxShadow: `0 0 12px ${o.color}, 0 0 24px ${o.color}80`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Eyebrow */}
      <p
        className="mb-5 text-[11px] font-medium uppercase fade-in"
        style={{ color: "var(--ember)", letterSpacing: "2.4px" }}
      >
        The board is gathering
      </p>

      {/* Cycling message */}
      <div className="relative h-9 w-full text-center">
        {MESSAGES.map((m, i) => (
          <p
            key={m}
            className="absolute inset-0 text-[22px] md:text-[26px] font-medium"
            style={{
              color: "#F5F5F0",
              letterSpacing: "-0.3px",
              opacity: i === idx ? 1 : 0,
              transform: i === idx ? "translateY(0)" : i < idx ? "translateY(-8px)" : "translateY(8px)",
              transition: "opacity 600ms ease, transform 600ms ease",
            }}
          >
            {m}
          </p>
        ))}
      </div>

      {/* Step dots */}
      <div className="mt-10 flex items-center gap-2.5">
        {MESSAGES.map((_, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <span
              key={i}
              style={{
                width: active ? 22 : 6,
                height: 6,
                borderRadius: 999,
                background: done
                  ? "rgba(255,107,53,0.55)"
                  : active
                    ? "var(--ember)"
                    : "rgba(245,245,240,0.14)",
                boxShadow: active ? "0 0 14px rgba(255,107,53,0.7)" : "none",
                transition: "all 500ms ease",
              }}
            />
          );
        })}
      </div>

      {/* Slim progress bar */}
      <div
        className="mt-8 h-[2px] w-full max-w-sm overflow-hidden rounded-full"
        style={{ background: "rgba(245,245,240,0.06)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            background:
              "linear-gradient(90deg, rgba(255,107,53,0) 0%, var(--ember) 50%, var(--amber-glow) 100%)",
            boxShadow: "0 0 10px rgba(255,107,53,0.5)",
            transition: "width 200ms linear",
          }}
        />
      </div>

      <p
        className="mt-6 text-[12px] fade-in"
        style={{ color: "#6B6B5C", letterSpacing: "0.3px" }}
      >
        Usually takes 20–30 seconds
      </p>

      <style>{`
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes core-flicker {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          45% { transform: translate(-50%, -50%) scale(1.06); opacity: 0.92; }
          70% { transform: translate(-50%, -50%) scale(0.97); opacity: 1; }
        }
        @keyframes ember-breathe {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>
    </main>
  );
}

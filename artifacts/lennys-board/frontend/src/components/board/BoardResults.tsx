import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cog,
  Download,
  Eye,
  Pause,
  Play,
  Telescope,
  UserCircle2,
  Zap,
} from "lucide-react";
import type { BoardResponse, PickYourMove } from "./types";
import { generateBoardPdf } from "./generateBoardPdf";
import avatarChallenger from "@/assets/avatar-challenger.png";
import avatarOperator from "@/assets/avatar-operator.png";
import avatarVisionary from "@/assets/avatar-visionary.png";
import avatarUserAdvocate from "@/assets/avatar-user-advocate.png";
import avatarDataOracle from "@/assets/avatar-data-oracle.png";

const ICONS: Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
> = {
  CHALLENGER: Zap,
  OPERATOR: Cog,
  VISIONARY: Telescope,
  "USER ADVOCATE": UserCircle2,
  "DATA ORACLE": Eye,
};

const AVATARS: Record<string, string> = {
  CHALLENGER: avatarChallenger,
  OPERATOR: avatarOperator,
  VISIONARY: avatarVisionary,
  "USER ADVOCATE": avatarUserAdvocate,
  "DATA ORACLE": avatarDataOracle,
};

function RoleAvatar({ role, size }: { role: string; size: number }) {
  const src = AVATARS[role.toUpperCase()];
  const color = roleColor(role);
  if (!src) {
    const Icon = ICONS[role.toUpperCase()] ?? Zap;
    return (
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          background: hexToRgba(color, 0.1),
          border: `1px solid ${hexToRgba(color, 0.25)}`,
        }}
      >
        <Icon size={Math.round(size * 0.5)} strokeWidth={1.75} color={color} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={role}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        border: `1px solid ${hexToRgba(color, 0.45)}`,
        boxShadow: `0 0 0 1px ${hexToRgba(color, 0.15)}`,
      }}
    />
  );
}

const ROLE_COLORS: Record<string, string> = {
  CHALLENGER: "#EF4444",
  OPERATOR: "#3B82F6",
  VISIONARY: "#8B5CF6",
  "USER ADVOCATE": "#22C55E",
  "DATA ORACLE": "#F59E0B",
};

function roleColor(role: string) {
  return ROLE_COLORS[role.toUpperCase()] ?? "#FF6B35";
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Stage = "player" | "debate" | "synthesis" | "pick";
const DURATION_MS = 12000;

export function BoardResults({ data, onReset, problem }: { data: BoardResponse; onReset: () => void; problem: string }) {
  const [stage, setStage] = useState<Stage>("player");
  const isDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "true";

  const reviewBoard = () => setStage("player");

  function renderStage() {
    if (stage === "player")
      return <BoardPlayer data={data} onComplete={() => setStage("debate")} />;
    if (stage === "debate")
      return (
        <DebateView
          data={data}
          onContinue={() => setStage("synthesis")}
          onReviewBoard={reviewBoard}
        />
      );
    if (stage === "pick" && data.pick_your_move)
      return (
        <PickYourMoveScreen
          moves={data.pick_your_move}
          data={data}
          problem={problem}
          onBack={() => setStage("synthesis")}
          onReviewBoard={reviewBoard}
          onReset={onReset}
        />
      );
    return (
      <SynthesisView
        data={data}
        onReviewBoard={reviewBoard}
        onPickMove={
          data.pick_your_move && data.pick_your_move.length > 0
            ? () => setStage("pick")
            : undefined
        }
      />
    );
  }

  return (
    <>
      {renderStage()}
      {isDebug && <DebugPanel data={data} />}
    </>
  );
}

function DebugPanel({ data }: { data: BoardResponse }) {
  const [open, setOpen] = useState(false);
  const totalCost = data.call_log.reduce((s, c) => s + (c.cost_usd || 0), 0);
  const totalTokens = data.call_log.reduce((s, c) => s + c.input_tokens + c.output_tokens, 0);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: "rgba(10,10,8,0.95)",
        border: "1px solid rgba(255,107,53,0.35)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        minWidth: 220,
        maxWidth: 420,
        fontSize: 12,
        fontFamily: "monospace",
      }}
    >
      {/* Header pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-2.5"
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#F5F5F0" }}
      >
        <span style={{ color: "#FF6B35", fontWeight: 700 }}>⏱ debug</span>
        <span style={{ color: "#8A8A7A" }}>
          {data.timing ? `${data.timing.total_s}s` : "—"} · ${totalCost.toFixed(4)} · {totalTokens.toLocaleString()} tok
        </span>
        <ChevronDown size={12} style={{ color: "#8A8A7A", transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div style={{ borderTop: "1px solid rgba(255,107,53,0.15)", padding: "12px 16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Timing bars */}
          {data.timing && (
            <div>
              <p style={{ color: "#8A8A7A", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>timing</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {(
                  [
                    ["analyze",     data.timing.analyze_s],
                    ["retrieve",    data.timing.retrieve_s],
                    ["select",      data.timing.select_board_s],
                    ["responses×5", data.timing.board_responses_s],
                    ["debate+lenny",data.timing.debate_lenny_s],
                    ["synth+pick",  data.timing.synthesis_pick_s],
                  ] as [string, number][]
                ).map(([label, secs]) => {
                  const pct = Math.round((secs / data.timing!.total_s) * 100);
                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 82, flexShrink: 0, color: "#8A8A7A" }}>{label}</span>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,107,53,0.12)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: "rgba(255,107,53,0.6)" }} />
                      </div>
                      <span style={{ width: 32, textAlign: "right", color: "#F5F5F0" }}>{secs}s</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,107,53,0.12)", paddingTop: 4, marginTop: 2, fontWeight: 700 }}>
                  <span style={{ color: "#8A8A7A" }}>total</span>
                  <span style={{ color: "#FF6B35" }}>{data.timing.total_s}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Token table */}
          <div>
            <p style={{ color: "#8A8A7A", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>tokens</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {data.call_log.map((c, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? "1px solid rgba(255,107,53,0.07)" : "none" }}>
                    <td style={{ padding: "2px 8px 2px 0", color: "#8A8A7A" }}>{c.task}</td>
                    <td style={{ padding: "2px 8px 2px 0", textAlign: "right", color: "#F5F5F0" }}>{c.input_tokens + c.output_tokens}</td>
                    <td style={{ padding: "2px 0", textAlign: "right", color: "#F5F5F0" }}>${c.cost_usd.toFixed(4)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "1px solid rgba(255,107,53,0.25)", fontWeight: 700 }}>
                  <td style={{ padding: "4px 8px 0 0", color: "#8A8A7A" }}>total</td>
                  <td style={{ padding: "4px 8px 0 0", textAlign: "right", color: "#FF6B35" }}>{totalTokens.toLocaleString()}</td>
                  <td style={{ padding: "4px 0 0 0", textAlign: "right", color: "#FF6B35" }}>${totalCost.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewBoardLink({ onClick }: { onClick: () => void }) {
  return (
    <button
            type="button"
      onClick={onClick}
      className="mb-4 text-left text-[13px] transition-colors"
      style={{ background: "transparent", border: "none", color: "#8A8A7A", padding: 0 }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F0")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8A7A")}
    >
      ← Review the board
    </button>
  );
}

/* ============================================================
   PLAYER
============================================================ */
function BoardPlayer({ data, onComplete }: { data: BoardResponse; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0..1
  const [direction, setDirection] = useState<1 | -1>(1);
  const [animKey, setAnimKey] = useState(0);
  const startRef = useRef<number>(performance.now());
  const elapsedRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const total = data.board.length;
  const member = data.board[index];

  // advance helper
  const goTo = (next: number, dir: 1 | -1) => {
    if (next >= total) {
      onComplete();
      return;
    }
    if (next < 0) next = 0;
    setDirection(dir);
    setIndex(next);
    setAnimKey((k) => k + 1);
    elapsedRef.current = 0;
    startRef.current = performance.now();
    setProgress(0);
    setPlaying(true);
  };

  // timer loop
  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now() - elapsedRef.current;
    const tick = () => {
      const now = performance.now();
      const e = now - startRef.current;
      elapsedRef.current = e;
      const p = Math.min(e / DURATION_MS, 1);
      setProgress(p);
      if (p >= 1) {
        if (index + 1 >= total) {
          onComplete();
          return;
        }
        goTo(index + 1, 1);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index]);

  // pause records elapsed
  const togglePlay = () => {
    if (playing) {
      elapsedRef.current = performance.now() - startRef.current;
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  };

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1, 1);
      else if (e.key === "ArrowLeft") goTo(index - 1, -1);
      else if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing]);

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-8 pb-6"
      style={{ minHeight: "100vh" }}
    >
      {/* progress dots */}
      <div className="mb-8 flex w-full items-center justify-center gap-3">
        {data.board.map((_, i) => (
          <button
            type="button"
            key={i}
            onClick={() => goTo(i, i > index ? 1 : -1)}
            aria-label={`Go to member ${i + 1}`}
            className="h-2 w-2 rounded-full transition-all"
            style={{
              background: i === index ? "#FF6B35" : "rgba(255,107,53,0.2)",
              transform: i === index ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
        <span className="ml-3 text-[12px]" style={{ color: "#8A8A7A" }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* slide stage */}
      <div className="relative w-full overflow-hidden">
        <div
          key={animKey}
          className="flex flex-col items-center"
          style={{
            animation: `${direction === 1 ? "slide-in-right" : "slide-in-left"} 300ms ease-out both`,
          }}
        >
          {/* Big role avatar (80px) */}
          <RoleAvatar role={member.role} size={80} />

          <p
            className="mt-2 text-[11px] font-medium uppercase"
            style={{ color: roleColor(member.role), letterSpacing: "2px" }}
          >
            {member.role}
          </p>
          <h3 className="mt-2 text-[22px] font-bold" style={{ color: "#F5F5F0" }}>
            {member.guest_name}
          </h3>
          <p className="mb-6 text-[14px]" style={{ color: "#8A8A7A" }}>
            {member.guest_title}
          </p>

          {/* Response card */}
          <div
            className="response-fade w-full board-response-scroll"
            style={{
              maxWidth: 680,
              background: "rgba(255,107,53,0.04)",
              border: "1px solid rgba(255,107,53,0.12)",
              borderRadius: 18,
              padding: 32,
            }}
          >
            <p className="text-[16px]" style={{ color: "#F5F5F0", lineHeight: 1.8 }}>
              {member.response}
            </p>
            <p className="mt-5 text-[13px] italic" style={{ color: "#8A8A7A" }}>
              — {member.guest_name}, Lenny's Podcast
            </p>
          </div>
        </div>
      </div>

      {/* timer bar */}
      <div className="mt-6 w-full" style={{ maxWidth: 680 }}>
        <div className="h-[3px] w-full rounded-full" style={{ background: "rgba(255,107,53,0.12)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "#FF6B35",
              transition: playing ? "width 80ms linear" : "none",
            }}
          />
        </div>

        {/* controls */}
        <div className="mt-5 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => goTo(index - 1, -1)}
            disabled={index === 0}
            className="flex items-center gap-1.5 text-[13px] transition-colors disabled:opacity-30"
            style={{ color: "#8A8A7A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8A7A")}
          >
            <ChevronLeft size={16} /> Prev
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
            style={{ color: "#F5F5F0", background: "rgba(255,107,53,0.08)" }}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            type="button"
            onClick={() => goTo(index + 1, 1)}
            className="flex items-center gap-1.5 text-[13px] transition-colors"
            style={{ color: "#8A8A7A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8A7A")}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>

        {/* Next-up hint */}
        <div
          key={`next-${index}`}
          className="mt-3 text-center text-[12px]"
          style={{ color: "#8A8A7A", animation: "fade-in 200ms ease-out both" }}
        >
          {index + 1 >= total ? (
            "Next: The Debate"
          ) : (
            <>
              Next:{" "}
              <span style={{ color: roleColor(data.board[index + 1].role) }}>
                {data.board[index + 1].role}
              </span>{" "}
              · {data.board[index + 1].guest_name}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BigRoleIcon({ role }: { role: string }) {
  return <RoleIconBig role={role} />;
}

function RoleIconBig({ role }: { role: string }) {
  const r = role.toUpperCase();
  return (
    <div className="flex items-center justify-center">
      <RoleIconInline role={r} />
    </div>
  );
}

function RoleIconInline({ role }: { role: string }) {
  const Icon = ICONS[role] ?? Zap;
  return <Icon size={40} strokeWidth={1.75} color={roleColor(role)} />;
}

/* ============================================================
   DEBATE
============================================================ */

function DebateView({
  data,
  onContinue,
  onReviewBoard,
}: {
  data: BoardResponse;
  onContinue: () => void;
  onReviewBoard: () => void;
}) {
  const [showButton, setShowButton] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const clash = data.debate_clash ?? [];
  const a = data.board.find((m) => m.guest_name === clash[0]) ?? data.board[0];
  const b = data.board.find((m) => m.guest_name === clash[1]) ?? data.board[1] ?? data.board[0];

  return (
    <div className="mx-auto flex min-h-[88vh] w-full max-w-3xl flex-col px-6 py-16">
      <ReviewBoardLink onClick={onReviewBoard} />
      <div className="flex flex-1 flex-col items-center justify-center">
      <p
        className="mb-12 text-[11px] font-medium uppercase fade-in"
        style={{ color: "#FF6B35", letterSpacing: "2px" }}
      >
        The Debate
      </p>

      <div className="mb-10 flex w-full items-center justify-center gap-8 fade-in-up">
        {/* left */}
        <div className="flex flex-1 flex-col items-end gap-3">
          <RoleAvatar role={a.role} size={56} />
          <p className="text-right text-[15px] font-semibold" style={{ color: "#F5F5F0" }}>
            {a.guest_name}
          </p>
          <p className="text-right text-[12px]" style={{ color: roleColor(a.role) }}>
            {a.role}
          </p>
        </div>

        <div style={{ width: 1, height: 60, background: "#FF6B35" }} />

        {/* right */}
        <div className="flex flex-1 flex-col items-start gap-3">
          <RoleAvatar role={b.role} size={56} />
          <p className="text-left text-[15px] font-semibold" style={{ color: "#F5F5F0" }}>
            {b.guest_name}
          </p>
          <p className="text-left text-[12px]" style={{ color: roleColor(b.role) }}>
            {b.role}
          </p>
        </div>
      </div>

      <p
        className="mx-auto text-center text-[16px]"
        style={{
          maxWidth: 600,
          color: "#F5F5F0",
          lineHeight: 1.8,
          opacity: 0,
          animation: "fade-in 800ms ease-out 600ms forwards",
        }}
      >
        {data.debate}
      </p>

      {data.lenny_insight && (
        <div
          className="mx-auto mt-10 fade-in"
          style={{ maxWidth: 600, animationDelay: "800ms" }}
        >
          <div
            style={{
              borderLeft: "2px solid rgba(255,107,53,0.5)",
              paddingLeft: 20,
            }}
          >
            <p
              className="text-[15px] italic"
              style={{ color: "#F5F5F0", lineHeight: 1.7 }}
            >
              {data.lenny_insight}
            </p>
            <p
              className="mt-3 text-[12px] font-medium uppercase"
              style={{ color: "#FF6B35", letterSpacing: "1.5px" }}
            >
              Lenny's Take
            </p>
          </div>
        </div>
      )}

      <div className="mt-12 h-12">
        {showButton && (
          <button
            type="button"
            onClick={onContinue}
            className="fade-in rounded-full px-7 py-3 text-[14px] font-medium transition-all hover:scale-[1.02]"
            style={{
              background: "transparent",
              border: "1px solid #FF6B35",
              color: "#F5F5F0",
              borderRadius: 980,
            }}
          >
            Continue to synthesis →
          </button>
        )}
      </div>
      </div>
    </div>
  );
}

function RoleIconInlineSmall({ role }: { role: string }) {
  const Icon = ICONS[role.toUpperCase()] ?? Zap;
  return <Icon size={26} strokeWidth={1.75} color={roleColor(role)} />;
}

/* ============================================================
   SYNTHESIS
============================================================ */
function SynthesisView({
  data,
  onReviewBoard,
  onPickMove,
}: {
  data: BoardResponse;
  onReviewBoard: () => void;
  onPickMove?: () => void;
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const sections = [
    { label: "What the board agrees", text: data.synthesis.agrees, accent: false },
    { label: "The open question", text: data.synthesis.tension, accent: false },
    { label: "Your next move", text: data.synthesis.next_move, accent: true },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-16">
      <ReviewBoardLink onClick={onReviewBoard} />
      <p
        className="mb-12 text-center text-[11px] font-medium uppercase fade-in"
        style={{ color: "#FF6B35", letterSpacing: "2px" }}
      >
        The Board Has Spoken
      </p>

      <div>
        {sections.map((s, i) => (
          <div key={s.label}>
            {i > 0 && <div className="my-8 h-px w-full" style={{ background: "rgba(255,107,53,0.1)" }} />}
            <div
              className="fade-in-up"
              style={{
                animationDelay: `${i * 800}ms`,
                paddingLeft: s.accent ? 20 : 0,
                borderLeft: s.accent ? "3px solid #FF6B35" : "none",
              }}
            >
              <p
                className="mb-3 text-[11px] font-medium uppercase"
                style={{ color: "#FF6B35", letterSpacing: "2px" }}
              >
                {s.label}
              </p>
              <p className="text-[16px]" style={{ color: "#F5F5F0", lineHeight: 1.75 }}>
                {s.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pick Your Move CTA */}
      {onPickMove && (
        <div className="mt-10 flex justify-center fade-in" style={{ animationDelay: "2400ms" }}>
          <button
            type="button"
            onClick={onPickMove}
            className="rounded-full px-7 py-3 transition-transform hover:scale-[1.02]"
            style={{
              background: "#FF6B35",
              color: "#000",
              fontSize: 17,
              fontWeight: 600,
              borderRadius: 980,
            }}
          >
            Pick Your Move →
          </button>
        </div>
      )}

      {/* Sources accordion */}
      <div className="mt-12 fade-in" style={{ animationDelay: "2400ms" }}>
        <button
            type="button"
          onClick={() => setSourcesOpen((v) => !v)}
          className="flex w-full items-center gap-2 py-3 text-left text-[14px]"
          style={{ color: "#8A8A7A" }}
        >
          <ChevronDown
            size={16}
            className="transition-transform"
            style={{ transform: sourcesOpen ? "rotate(0)" : "rotate(-90deg)" }}
          />
          Sources
        </button>
        {sourcesOpen && (
          <ul className="space-y-2 border-t border-[rgba(255,107,53,0.1)] pt-4">
            {data.board.map((m, i) => (
              <li key={i} className="text-[14px]" style={{ color: "#F5F5F0" }}>
                <span className="font-medium">{m.guest_name}</span>
                <span style={{ color: "#8A8A7A" }}>
                  {" "}— {m.episode_title} · {m.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>


    </div>
  );
}

/* ============================================================
   PICK YOUR MOVE
============================================================ */

function PickYourMoveScreen({
  moves,
  data,
  problem,
  onBack,
  onReviewBoard,
  onReset,
}: {
  moves: PickYourMove[];
  data: BoardResponse;
  problem: string;
  onBack: () => void;
  onReviewBoard: () => void;
  onReset: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);

  function handleChoose(i: number) {
    setChosen(i);
    generateBoardPdf(problem, data, moves[i]);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-16">
      <ReviewBoardLink onClick={onReviewBoard} />
      <p
        className="mb-3 text-center text-[11px] font-medium uppercase fade-in"
        style={{ color: "#FF6B35", letterSpacing: "2px" }}
      >
        Pick Your Move
      </p>
      <p
        className="mb-8 text-center text-[16px] fade-in"
        style={{ color: "#8A8A7A" }}
      >
        Three paths forward. Choose one.
      </p>

      <div className="mx-auto flex flex-col gap-4" style={{ maxWidth: 680 }}>
        {moves.map((m, i) => {
          const isSelected = selected === i;
          const isChosen = chosen === i;
          const isDimmed = chosen !== null && chosen !== i;

          return (
            <div
              key={i}
              onClick={() => chosen === null && setSelected(isSelected ? null : i)}
              className="fade-in-up"
              style={{
                animationDelay: `${i * 150}ms`,
                background: isChosen
                  ? "rgba(255,107,53,0.10)"
                  : "rgba(255,107,53,0.04)",
                border: isChosen
                  ? "1px solid #FF6B35"
                  : isSelected
                    ? "1px solid rgba(255,107,53,0.5)"
                    : "1px solid rgba(255,107,53,0.12)",
                borderRadius: 18,
                padding: "28px 32px",
                boxShadow: isChosen
                  ? "0 0 28px rgba(255,107,53,0.25)"
                  : isSelected
                    ? "0 0 12px rgba(255,107,53,0.1)"
                    : "none",
                transition: "all 0.3s ease",
                opacity: isDimmed ? 0.28 : 1,
                cursor: chosen !== null ? "default" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (chosen !== null) return;
                if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,107,53,0.35)";
                e.currentTarget.style.transform = "scale(1.01)";
              }}
              onMouseLeave={(e) => {
                if (chosen !== null) return;
                if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,107,53,0.12)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isChosen && (
                <p
                  className="mb-3 text-[10px] font-bold uppercase"
                  style={{ color: "#FF6B35", letterSpacing: "1.5px" }}
                >
                  ✓ Chosen path — board brief downloading…
                </p>
              )}

              <h4 className="text-[18px] font-bold" style={{ color: "#F5F5F0" }}>
                {m.title}
              </h4>
              <p
                className="mt-2 text-[15px]"
                style={{ color: "#8A8A7A", lineHeight: 1.6 }}
              >
                {m.action}
              </p>

              {(isSelected || isChosen) && (
                <>
                  <p
                    className="mt-3 text-[14px] italic"
                    style={{
                      color: "#8A8A7A",
                      opacity: 0,
                      animation: "fade-in 400ms ease-out forwards",
                    }}
                  >
                    Why this works: {m.reasoning}
                  </p>
                  {m.tradeoff && (
                    <p
                      className="mt-2 text-[14px]"
                      style={{
                        color: "#8A8A7A",
                        opacity: 0,
                        animation: "fade-in 400ms ease-out 200ms forwards",
                      }}
                    >
                      <span style={{ color: "#F59E0B" }}>What you're giving up:</span>{" "}
                      {m.tradeoff}
                    </p>
                  )}

                </>
              )}

              <div
                className="mt-4 flex items-center justify-between"
              >
                <p className="text-[12px]" style={{ color: "#FF6B35" }}>
                  Backed by {m.backed_by}
                </p>
                {(isSelected || isChosen) && (
                  <div style={{ opacity: 0, animation: "fade-in 400ms ease-out 350ms forwards" }}>
                    {isChosen ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); generateBoardPdf(problem, data, moves[i]); }}
                        className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(255,107,53,0.7)",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <Download size={12} />
                        Re-download brief
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleChoose(i); }}
                        className="transition-all hover:opacity-80"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,107,53,0.45)",
                          color: "#FF6B35",
                          fontSize: 11,
                          fontWeight: 500,
                          borderRadius: 980,
                          padding: "5px 12px",
                          cursor: "pointer",
                        }}
                      >
                        Choose this path →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full px-7 py-3 transition-transform hover:scale-[1.02]"
          style={{
            background: "#FF6B35",
            color: "#000",
            fontSize: 17,
            fontWeight: 600,
            borderRadius: 980,
            cursor: "pointer",
          }}
        >
          Bring a new problem
        </button>
        <div className="text-[13px]" style={{ color: "#8A8A7A" }}>
          <button
            type="button"
            onClick={onBack}
            className="transition-colors"
            style={{ background: "transparent", border: "none", color: "inherit", padding: 0, cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8A7A")}
          >
            ← Back to synthesis
          </button>
          <span className="mx-2">·</span>
          <button
            type="button"
            onClick={onReviewBoard}
            className="transition-colors"
            style={{ background: "transparent", border: "none", color: "inherit", padding: 0, cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8A7A")}
          >
            ← Review the board
          </button>
        </div>
      </div>
    </div>
  );
}

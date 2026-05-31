import { useRef, useState } from "react";
import html2canvas from "html2canvas";

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 0 }}>
      <div className="w-px bg-gray-300" style={{ height: 10 }} />
      {label ? (
        <span
          className="font-mono text-gray-600 bg-white border border-gray-200 rounded px-2"
          style={{ fontSize: 11, lineHeight: "20px", whiteSpace: "nowrap" }}
        >
          {label}
        </span>
      ) : null}
      <div className="w-px bg-gray-300" style={{ height: 10 }} />
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "6px solid #D1D5DB",
        }}
      />
    </div>
  );
}

function HArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-shrink-0" style={{ width: 120 }}>
      <div className="flex items-center w-full">
        <div className="flex-1 bg-gray-300" style={{ height: 1 }} />
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderLeft: "7px solid #D1D5DB",
          }}
        />
      </div>
      {label && (
        <span className="font-mono text-gray-600 mt-1" style={{ fontSize: 11, textAlign: "center", lineHeight: 1.4 }}>
          {label}
        </span>
      )}
    </div>
  );
}

function Step({
  label,
  sub,
  badge,
  bg,
  border,
  textColor,
  subColor,
  badgeBg,
  badgeText,
}: {
  label: string;
  sub?: string;
  badge?: string;
  bg: string;
  border: string;
  textColor: string;
  subColor: string;
  badgeBg?: string;
  badgeText?: string;
}) {
  return (
    <div
      className={`rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 ${bg} border ${border}`}
    >
      <div>
        <div className={`font-semibold text-sm ${textColor}`}>{label}</div>
        {sub && <div className={`font-mono mt-0.5 ${subColor}`} style={{ fontSize: 10 }}>{sub}</div>}
      </div>
      {badge && (
        <span
          className={`font-mono rounded px-2 flex-shrink-0 ${badgeBg} ${badgeText}`}
          style={{ fontSize: 9, lineHeight: "18px" }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function SystemArchitecture() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = "lennys-board-room-architecture.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8" style={{ gap: 12 }}>
      {/* Toolbar — sits above the card, excluded from PNG export */}
      <div className="flex justify-end w-full" style={{ maxWidth: 860 }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 shadow-sm"
          style={{ fontSize: 13, height: 36, fontWeight: 500 }}
        >
          {downloading ? "Saving…" : "⬇ Download PNG"}
        </button>
      </div>

      <div
        ref={cardRef}
        className="bg-white rounded-2xl border border-gray-200 w-full"
        style={{ maxWidth: 860, boxShadow: "0 4px 32px rgba(0,0,0,0.07)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-bold text-gray-900 tracking-tight" style={{ fontSize: 20 }}>
                System Architecture
              </h1>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {["React 19", "FastAPI", "gpt-4o / gpt-4o-mini", "text-embedding-3-small", "Supabase pgvector"].map(
                (t) => (
                  <span
                    key={t}
                    className="bg-gray-100 text-gray-500 rounded font-mono px-2"
                    style={{ fontSize: 10, lineHeight: "20px" }}
                  >
                    {t}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-7 space-y-8">
          {/* ── LAYER 1 ── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span
                className="font-bold text-gray-500 uppercase tracking-widest"
                style={{ fontSize: 11 }}
              >
                Layer 1 · Product Stack
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="flex items-start">
              {/* React */}
              <div
                className="rounded-xl text-white flex-shrink-0"
                style={{ background: "#3B82F6", padding: "14px 18px", width: 160 }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: "#BFDBFE", letterSpacing: "0.08em", marginBottom: 4 }}>
                  FRONTEND
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>React Frontend</div>
                <div style={{ fontSize: 10, color: "#BFDBFE", marginTop: 4, lineHeight: 1.4 }}>
                  React 19 · Vite
                  <br />
                  TanStack Router
                </div>
              </div>

              <HArrow label="POST /assemble" />

              {/* FastAPI */}
              <div
                className="rounded-xl text-white flex-1"
                style={{ background: "#EA580C", padding: "14px 18px" }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: "#FED7AA", letterSpacing: "0.08em", marginBottom: 4 }}>
                  BACKEND
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>FastAPI Backend</div>
                <div style={{ fontSize: 10, color: "#FED7AA", marginTop: 4, lineHeight: 1.4 }}>
                  uvicorn · Python 3.11 · ThreadPoolExecutor (×5 parallel workers)
                </div>
              </div>

              <HArrow label="embed · query · ← chunks" />

              {/* Supabase */}
              <div
                className="rounded-xl text-white flex-shrink-0"
                style={{ background: "#7C3AED", padding: "14px 18px", width: 160 }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: "#DDD6FE", letterSpacing: "0.08em", marginBottom: 4 }}>
                  DATA STORE
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Supabase</div>
                <div style={{ fontSize: 10, color: "#DDD6FE", marginTop: 4, lineHeight: 1.4 }}>
                  pgvector · 2,178 chunks
                  <br />
                  50 podcast guests
                </div>
              </div>
            </div>
          </div>

          {/* ── LAYER 2 ── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span
                className="font-bold text-gray-500 uppercase tracking-widest"
                style={{ fontSize: 11 }}
              >
                Layer 2 · RAG Pipeline
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="flex gap-6">
              {/* Pipeline */}
              <div className="flex-1 flex flex-col items-stretch">
                <Step
                  label="Problem Input"
                  sub="User's PM problem"
                  bg="bg-gray-50"
                  border="border-gray-200"
                  textColor="text-gray-700"
                  subColor="text-gray-400"
                />

                <Arrow label="gpt-4o-mini" />

                <Step
                  label="Analyze"
                  sub="Extract intent · generate semantic search queries"
                  bg="bg-amber-50"
                  border="border-amber-200"
                  textColor="text-amber-900"
                  subColor="text-amber-500"
                />

                <Arrow label="text-embedding-3-small + match_chunks RPC" />

                <Step
                  label="Retrieve Chunks"
                  sub="Embed queries · cosine similarity · top-10 results"
                  badge="→ Supabase pgvector"
                  bg="bg-violet-50"
                  border="border-violet-200"
                  textColor="text-violet-900"
                  subColor="text-violet-500"
                  badgeBg="bg-violet-100"
                  badgeText="text-violet-600"
                />

                <Arrow label="gpt-4o-mini" />

                <Step
                  label="Select Board"
                  sub="5 guests from chunks → assign roles (Challenger, Operator, Visionary…)"
                  bg="bg-amber-50"
                  border="border-amber-200"
                  textColor="text-amber-900"
                  subColor="text-amber-500"
                />

                <Arrow label="×5 parallel · gpt-4o-mini" />

                <Step
                  label="Generate Responses"
                  sub="5 board perspectives · parallel ThreadPoolExecutor · ContextVar call_log"
                  bg="bg-emerald-50"
                  border="border-emerald-200"
                  textColor="text-emerald-900"
                  subColor="text-emerald-600"
                />

                <Arrow label="parallel · gpt-4o" />

                <Step
                  label="Debate + Synthesis + Lenny Insight"
                  sub="3 parallel calls · most-opposed advisors debate · cross-pattern synthesis"
                  bg="bg-emerald-50"
                  border="border-emerald-200"
                  textColor="text-emerald-900"
                  subColor="text-emerald-600"
                />

                <Arrow label="gpt-4o" />

                <Step
                  label="Pick Your Move"
                  sub="3 actionable paths · advisor attribution · tradeoffs"
                  bg="bg-orange-50"
                  border="border-orange-200"
                  textColor="text-orange-900"
                  subColor="text-orange-500"
                />

                <Arrow />

                <Step
                  label="JSON Response"
                  sub="Streamed back to React Frontend"
                  bg="bg-gray-50"
                  border="border-gray-200"
                  textColor="text-gray-700"
                  subColor="text-gray-400"
                />
              </div>

              {/* Legend + stats sidebar */}
              <div className="flex-shrink-0" style={{ width: 152 }}>
                <div
                  className="font-bold text-gray-500 uppercase tracking-widest mb-3"
                  style={{ fontSize: 10 }}
                >
                  Step Legend
                </div>
                <div className="space-y-2" style={{ fontSize: 12 }}>
                  {[
                    { color: "#E5E7EB", label: "Input / Output" },
                    { color: "#FDE68A", label: "gpt-4o-mini" },
                    { color: "#DDD6FE", label: "pgvector retrieval" },
                    { color: "#A7F3D0", label: "Parallel generation" },
                    { color: "#FDBA74", label: "gpt-4o synthesis" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className="rounded flex-shrink-0 border border-gray-200"
                        style={{ width: 12, height: 12, background: color }}
                      />
                      <span className="text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="font-bold text-gray-500 uppercase tracking-widest mt-6 mb-3"
                  style={{ fontSize: 10 }}
                >
                  Data
                </div>
                <div className="space-y-1 text-gray-600" style={{ fontSize: 12 }}>
                  <div>2,178 transcript chunks</div>
                  <div>50 podcast guests</div>
                  <div>Lenny's newsletters</div>
                  <div>1536-dim vectors</div>
                </div>

                <div
                  className="font-bold text-gray-500 uppercase tracking-widest mt-6 mb-3"
                  style={{ fontSize: 10 }}
                >
                  Cost per run
                </div>
                <div className="space-y-1 text-gray-600" style={{ fontSize: 12 }}>
                  <div>~11 LLM calls</div>
                  <div>≈ $0.03 – $0.08</div>
                  <div>~25–35 sec</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

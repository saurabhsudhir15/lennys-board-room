import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CampfireLoading } from "@/components/board/CampfireLoading";
import { BoardResults } from "@/components/board/BoardResults";
import type { BoardResponse } from "@/components/board/types";

export const Route = createFileRoute("/")({
  component: Index,
});

const EXAMPLES = [
  "DAU flat for 3 months — can't find the cause",
  "CEO attached to 3 features I need to cut",
  "Enterprise or double down on SMB?",
  "Engineering says 6 weeks will take 6 months",
];

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "done"; data: BoardResponse };

function Index() {
  const [problem, setProblem] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit() {
    if (!problem.trim()) return;
    setState({ kind: "loading" });
    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiUrl}/api/assemble`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem }),
      });
      if (!res.ok) throw new Error("bad");
      const data = (await res.json()) as BoardResponse;
      setState({ kind: "done", data });
    } catch {
      setState({ kind: "error" });
    }
  }

  function reset() {
    setProblem("");
    setState({ kind: "idle" });
  }

  if (state.kind === "loading") return <CampfireLoading />;

  if (state.kind === "done")
    return <BoardResults data={state.data} onReset={reset} />;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-6 pb-24 pt-24 md:pt-32">
      {state.kind === "error" && (
        <div
          className="mb-8 w-full rounded-2xl px-5 py-4 text-center fade-in"
          style={{
            background: "rgba(255,107,53,0.06)",
            border: "1px solid rgba(255,107,53,0.2)",
            color: "#F5F5F0",
          }}
        >
          The board is taking longer than usual.{" "}
          <button
            type="button"
            onClick={submit}
            className="font-semibold underline"
            style={{ color: "var(--ember)" }}
          >
            Try again?
          </button>
        </div>
      )}

      <p
        className="mb-6 text-[11px] font-medium uppercase fade-in"
        style={{ color: "var(--ember)", letterSpacing: "2px" }}
      >
        Powered by Lenny's Podcast
      </p>

      <h1
        className="text-center text-[44px] font-bold leading-[1.05] tracking-tight md:text-[64px] fade-in-up"
        style={{ color: "#F5F5F0", letterSpacing: "-1px" }}
      >
        Your board of advisors.
        <br />
        <span style={{ color: "#F5F5F0" }}>Assembled from the best.</span>
      </h1>

      <p
        className="mt-6 max-w-xl text-center text-[19px] fade-in-up"
        style={{ color: "#8A8A7A", lineHeight: 1.5, animationDelay: "100ms" }}
      >
        Bring your toughest product problem.
        <br />
        Five advisors from Lenny's podcast will debate it.
      </p>

      <div className="mt-12 w-full fade-in-up" style={{ animationDelay: "200ms" }}>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="What's the problem keeping you up at night?"
          rows={5}
          className="w-full resize-none px-5 py-4 text-[16px] outline-none transition-all focus:shadow-[0_0_0_4px_rgba(255,107,53,0.08)]"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,107,53,0.2)",
            borderRadius: "14px",
            color: "#F5F5F0",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,107,53,0.5)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,107,53,0.2)")}
        />

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              type="button"
              key={ex}
              onClick={() => setProblem(ex)}
              className="px-3.5 py-1.5 text-[12px] transition-colors hover:bg-[rgba(255,107,53,0.14)]"
              style={{
                background: "rgba(255,107,53,0.08)",
                border: "1px solid rgba(255,107,53,0.2)",
                color: "#F5F5F0",
                borderRadius: "980px",
              }}
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={submit}
            disabled={!problem.trim()}
            className="px-8 py-3.5 text-[17px] font-semibold transition-all hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            style={{
              background: "var(--ember)",
              color: "#000",
              borderRadius: "980px",
              boxShadow: "0 10px 40px -10px rgba(255,107,53,0.5)",
            }}
          >
            Assemble Your Board →
          </button>
        </div>
      </div>
    </main>
  );
}

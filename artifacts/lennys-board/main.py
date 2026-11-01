"""FastAPI entry point — replaces Streamlit app.py for the React frontend."""
from contextvars import ContextVar, copy_context
from types import ModuleType
import concurrent.futures
import sys
import traceback

# Local/non-Replit environments don't have secrets injected into the process
# env automatically — load a .env file if present. No-op in production hosts
# that already inject real env vars (python-dotenv never overrides existing ones).
from dotenv import load_dotenv
load_dotenv()

# ---------------------------------------------------------------------------
# Patch streamlit BEFORE importing board.py.
# board.py uses st.session_state["call_log"] for token logging.
# We replace it with a ContextVar so each request gets its own list,
# thread-safe even when board.py runs 5 parallel LLM calls.
# ---------------------------------------------------------------------------
_call_log_var: ContextVar[list] = ContextVar("call_log", default=[])

class _FakeState:
    def __contains__(self, key):
        return key == "call_log"
    def __getitem__(self, key):
        if key == "call_log":
             return _call_log_var.get()
        raise KeyError(key)
    def __setitem__(self, key, value):
        if key == "call_log":
            _call_log_var.set(value)
    def get(self, key, default=None):
        try:
            return self[key]
        except KeyError:
            return default

class _FakeST(ModuleType):
    session_state = _FakeState()
sys.modules.setdefault("streamlit", _FakeST("streamlit"))

# ---------------------------------------------------------------------------
# Now it's safe to import board and config
# ---------------------------------------------------------------------------
import board  # noqa: E402
import config  # noqa: E402

import time
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os

app = FastAPI(title="Lenny's Board of Directors")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


class ProblemRequest(BaseModel):
    problem: str


@app.get("/health")
async def health():
    return {"status": "ok"}

# Replit's preview proxy opens this WebSocket expecting Streamlit protocol.
# Accept and hold the connection open until the client disconnects —
# closing immediately causes the preview wrapper to crash on page interactions.
@app.websocket("/_stcore/stream")
async def stcore_stream_noop(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            msg = await websocket.receive()
            if msg.get("type") == "websocket.disconnect":
                break
    except Exception:
        pass

@app.post("/assemble")
@app.post("/api/assemble")
def assemble(body: ProblemRequest):
    if not body.problem.strip():
        raise HTTPException(status_code=400, detail="problem is required")

    # Reset call log for this request
    _call_log_var.set([])

    try:
        t_start = time.perf_counter()

        # 1. Analyze problem to get search queries
        t0 = time.perf_counter()
        analysis = board.analyze_problem(body.problem)
        t_analyze = round(time.perf_counter() - t0, 2)

        # 2. Retrieve relevant chunks from Supabase
        t0 = time.perf_counter()
        chunks = board.retrieve_chunks(analysis["search_queries"])
        t_retrieve = round(time.perf_counter() - t0, 2)

        # 3. Select 5 board members + assign roles
        t0 = time.perf_counter()
        board_members = board.select_board(body.problem, chunks)
        t_select = round(time.perf_counter() - t0, 2)

        # 4. Generate all 5 responses in parallel
        t0 = time.perf_counter()
        responses = board.generate_all_responses(board_members, body.problem)
        t_responses = round(time.perf_counter() - t0, 2)

        # Step 5: Debate + Lenny insight in parallel
        t0 = time.perf_counter()
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_debate = executor.submit(copy_context().run, board.generate_debate, board_members, responses)
            future_lenny = executor.submit(copy_context().run, board.generate_lenny_insight, body.problem, board_members, responses, chunks)
            debate_result = future_debate.result()
            lenny_insight = future_lenny.result()
        t_debate_lenny = round(time.perf_counter() - t0, 2)

        # Step 6: Synthesis (needs clash names) + Pick Your Move (independent) — run in parallel
        t0 = time.perf_counter()
        def _synthesis():
            raw = board.generate_synthesis(body.problem, board_members, responses, debate_result["clash"])
            paragraphs = [p.strip() for p in raw.strip().split("\n\n") if p.strip()]
            return {
                "agrees": paragraphs[0] if len(paragraphs) > 0 else raw,
                "tension": paragraphs[1] if len(paragraphs) > 1 else "",
                "next_move": paragraphs[2] if len(paragraphs) > 2 else "",
            }

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_synthesis = executor.submit(copy_context().run, _synthesis)
            future_pick = executor.submit(copy_context().run, board.generate_pick_your_move, body.problem, board_members, responses)
            synthesis = future_synthesis.result()
            pick_your_move = future_pick.result()
        t_synthesis_pick = round(time.perf_counter() - t0, 2)

        t_total = round(time.perf_counter() - t_start, 2)
        timing = {
            "analyze_s": t_analyze,
            "retrieve_s": t_retrieve,
            "select_board_s": t_select,
            "board_responses_s": t_responses,
            "debate_lenny_s": t_debate_lenny,
            "synthesis_pick_s": t_synthesis_pick,
            "total_s": t_total,
        }
        print(f"[timing] total={t_total}s | analyze={t_analyze} retrieve={t_retrieve} select={t_select} responses={t_responses} debate+lenny={t_debate_lenny} synthesis+pick={t_synthesis_pick}")

        # Build board list with guest titles for the frontend
        result_board = []
        for member, response in zip(board_members, responses):
            result_board.append({
                "guest_name": member["guest_name"],
                "guest_title": "Lenny's Podcast",
                "role": member["role"],
                "response": response,
                "episode_title": member.get("title", ""),
                "date": member.get("date", ""),
            })

        return {
            "board": result_board,
            "debate": debate_result["text"],
            "debate_clash": debate_result["clash"],
            "synthesis": synthesis,
            "pick_your_move": pick_your_move,
            "lenny_insight": lenny_insight,
            "call_log": _call_log_var.get(),
            "timing": timing,
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=traceback.format_exc())


# ---------------------------------------------------------------------------
# Serve React frontend — must come AFTER all API routes
# ---------------------------------------------------------------------------
DIST_DIR = "frontend/dist/client"

if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=f"{DIST_DIR}/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        return FileResponse(f"{DIST_DIR}/index.html")

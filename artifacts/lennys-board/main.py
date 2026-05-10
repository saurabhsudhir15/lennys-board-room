"""FastAPI entry point — replaces Streamlit app.py for the React frontend."""
from contextvars import ContextVar
from types import ModuleType
import sys
import traceback

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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Lenny's Board of Directors")

# Allow all origins — the Lovable frontend can be on any domain
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

@app.get("/_stcore/health")
async def stcore_health():
    return {"status": "ok"}

@app.get("/_stcore/host-config")
async def stcore_host_config():
    return {} 

@app.post("/assemble")
async def assemble(body: ProblemRequest):
    if not body.problem.strip():
        raise HTTPException(status_code=400, detail="problem is required")

    # Reset call log for this request
    _call_log_var.set([])

    try:
        # 1. Analyze problem to get search queries
        analysis = board.analyze_problem(body.problem)

        # 2. Retrieve relevant chunks from Supabase
        chunks = board.retrieve_chunks(analysis["search_queries"])

        # 3. Select 5 board members + assign roles
        board_members = board.select_board(body.problem, chunks)

        # 4. Generate all 5 responses in parallel
        responses = board.generate_all_responses(board_members, body.problem)

        # 5. Generate the debate between most opposed members
        debate = board.generate_debate(board_members, responses)

        # 6. Generate synthesis
        synthesis_raw = board.generate_synthesis(body.problem, board_members, responses)

        # Parse synthesis: model returns 3 paragraphs separated by blank lines
        paragraphs = [p.strip() for p in synthesis_raw.strip().split("\n\n") if p.strip()]
        synthesis = {
            "agrees": paragraphs[0] if len(paragraphs) > 0 else synthesis_raw,
            "tension": paragraphs[1] if len(paragraphs) > 1 else "",
            "next_move": paragraphs[2] if len(paragraphs) > 2 else "",
        }

        # 7. Build board list with guest titles for the frontend
        result_board = []
        for member, response in zip(board_members, responses):
            result_board.append({
                "guest_name": member["guest_name"],
                "guest_title": config.GUEST_TITLES.get(
                    member["guest_name"], "Product Leader, Lenny's Podcast"
                ),
                "role": member["role"],
                "response": response,
                "episode_title": member.get("title", ""),
                "date": member.get("date", ""),
            })

        return {
            "board": result_board,
            "debate": debate,
            "synthesis": synthesis,
            "call_log": _call_log_var.get(),
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=traceback.format_exc())

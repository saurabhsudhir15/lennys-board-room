import re
import streamlit as st
import config
import board

st.set_page_config(
    page_title="Lenny's Board of Directors",
    page_icon="🎙️",
    layout="wide"
)

st.markdown("""
<style>
    /* ── Reset & base ── */
    * { box-sizing: border-box; }

    html, body, [data-testid="stAppViewContainer"],
    [data-testid="stApp"], .stApp {
        background-color: #000000 !important;
        color: #f5f5f7 !important;
    }

    [data-testid="stHeader"] {
        background-color: #000000 !important;
        border-bottom: none !important;
    }

    /* Remove default padding */
    .main .block-container {
        padding-top: 0 !important;
        padding-bottom: 80px !important;
        max-width: 960px !important;
        margin: 0 auto !important;
    }

    /* ── Typography ── */
    body, .stApp, p, span, label, div {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                     "Helvetica Neue", sans-serif !important;
        color: #f5f5f7;
    }

    /* ── Hide Streamlit chrome ── */
    #MainMenu { visibility: hidden !important; }
    footer { visibility: hidden !important; }
    header { visibility: hidden !important; }
    [data-testid="stToolbar"] { display: none !important; }
    [data-testid="stDecoration"] { display: none !important; }

    /* ── Landing hero ── */
    .hero-wrap {
        padding: 96px 0 64px;
        text-align: center;
    }
    .eyebrow {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #C9A84C;
        margin-bottom: 24px;
    }
    .hero-headline {
        font-size: 56px;
        font-weight: 700;
        letter-spacing: -0.5px;
        line-height: 1.07;
        color: #f5f5f7;
        margin-bottom: 16px;
    }
    .hero-sub {
        font-size: 19px;
        font-weight: 400;
        color: #6e6e73;
        margin-bottom: 48px;
        line-height: 1.5;
    }

    /* ── Textarea ── */
    .stTextArea textarea {
        background-color: rgba(255,255,255,0.05) !important;
        color: #f5f5f7 !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 14px !important;
        font-size: 16px !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                     "Helvetica Neue", sans-serif !important;
        padding: 14px 16px !important;
        line-height: 1.6 !important;
        resize: vertical;
    }
    .stTextArea textarea::placeholder {
        color: #6e6e73 !important;
    }
    .stTextArea textarea:focus {
        border-color: rgba(201,168,76,0.5) !important;
        box-shadow: none !important;
        outline: none !important;
    }
    /* Hide textarea label */
    .stTextArea label { display: none !important; }

    /* ── Chips (example problem buttons) ── */
    .chip-label {
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #6e6e73;
        margin-bottom: 12px;
        margin-top: 32px;
    }

    /* ── Buttons ── */
    /* Primary — gold CTA */
    div[data-testid="stButton"].primary-btn > button,
    .primary-btn .stButton > button {
        background-color: #C9A84C !important;
        color: #000000 !important;
        font-weight: 600 !important;
        font-size: 16px !important;
        border: none !important;
        border-radius: 980px !important;
        padding: 12px 28px !important;
        transition: opacity 0.2s ease !important;
        cursor: pointer !important;
    }
    div[data-testid="stButton"].primary-btn > button:hover {
        opacity: 0.88 !important;
    }

    /* Ghost — "bring a new problem" */
    div[data-testid="stButton"].ghost-btn > button,
    .ghost-btn .stButton > button {
        background-color: transparent !important;
        color: #f5f5f7 !important;
        font-weight: 500 !important;
        font-size: 15px !important;
        border: 1px solid rgba(255,255,255,0.25) !important;
        border-radius: 980px !important;
        padding: 10px 24px !important;
        transition: border-color 0.2s ease !important;
    }
    div[data-testid="stButton"].ghost-btn > button:hover {
        border-color: rgba(255,255,255,0.5) !important;
    }

    /* Chip style for example problems */
    div[data-testid="stButton"].chip-btn > button {
        background-color: rgba(255,255,255,0.06) !important;
        color: #f5f5f7 !important;
        font-size: 13px !important;
        font-weight: 400 !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        border-radius: 980px !important;
        padding: 8px 16px !important;
        transition: background-color 0.2s ease !important;
    }
    div[data-testid="stButton"].chip-btn > button:hover {
        background-color: rgba(255,255,255,0.1) !important;
    }

    /* Fallback — all other buttons get gold style */
    .stButton > button {
        background-color: #C9A84C !important;
        color: #000000 !important;
        font-weight: 600 !important;
        border: none !important;
        border-radius: 980px !important;
        padding: 10px 24px !important;
        transition: opacity 0.2s ease !important;
    }
    .stButton > button:hover {
        opacity: 0.88 !important;
    }

    /* ── Warning banner ── */
    .warning-banner {
        background-color: rgba(201,168,76,0.08);
        border: 1px solid rgba(201,168,76,0.3);
        border-radius: 12px;
        padding: 14px 18px;
        color: #C9A84C;
        font-size: 14px;
        margin-bottom: 24px;
        line-height: 1.5;
    }

    /* ── Board header ── */
    .board-header {
        padding: 72px 0 32px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        margin-bottom: 48px;
    }
    .board-eyebrow {
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #C9A84C;
        margin-bottom: 10px;
    }
    .board-headline {
        font-size: 40px;
        font-weight: 700;
        letter-spacing: -0.3px;
        color: #f5f5f7;
        margin-bottom: 10px;
    }
    .board-problem {
        font-size: 17px;
        color: #6e6e73;
        font-style: italic;
        line-height: 1.5;
    }

    /* ── Board member card ── */
    .board-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 18px;
        padding: 24px;
        margin-bottom: 20px;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        height: 100%;
    }
    .role-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #C9A84C;
        margin-bottom: 10px;
    }
    .guest-name {
        font-size: 17px;
        font-weight: 700;
        color: #f5f5f7;
        margin-bottom: 4px;
        letter-spacing: -0.1px;
    }
    .guest-title-text {
        font-size: 13px;
        color: #6e6e73;
        margin-bottom: 16px;
    }
    .response-text {
        font-size: 15px;
        color: #f5f5f7;
        line-height: 1.7;
    }
    .citation {
        font-size: 12px;
        color: #6e6e73;
        font-style: italic;
        margin-top: 16px;
    }

    /* ── Section divider ── */
    .section-divider {
        border: none;
        border-top: 1px solid rgba(255,255,255,0.08);
        margin: 48px 0;
    }

    /* ── Section label ── */
    .section-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #6e6e73;
        margin-bottom: 20px;
    }

    /* ── Debate box ── */
    .debate-box {
        background: rgba(201,168,76,0.06);
        border-left: 2px solid #C9A84C;
        border-radius: 12px;
        padding: 20px 24px;
        font-size: 15px;
        color: #f5f5f7;
        line-height: 1.7;
    }

    /* ── Synthesis card ── */
    .synthesis-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 18px;
        padding: 32px;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }
    .synthesis-section {
        padding: 20px 0;
        border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .synthesis-section:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }
    .synthesis-section:first-child {
        padding-top: 0;
    }
    .synthesis-eyebrow {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #C9A84C;
        margin-bottom: 10px;
    }
    .synthesis-text {
        font-size: 15px;
        color: #f5f5f7;
        line-height: 1.7;
    }

    /* ── Expanders ── */
    [data-testid="stExpander"] {
        background: rgba(255,255,255,0.03) !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 12px !important;
    }
    [data-testid="stExpander"] summary {
        font-size: 13px !important;
        color: #6e6e73 !important;
        font-weight: 500 !important;
        padding: 14px 18px !important;
    }
    [data-testid="stExpander"] summary:hover {
        color: #f5f5f7 !important;
    }
    .streamlit-expanderContent {
        padding: 0 18px 18px !important;
    }

    /* ── Loading ── */
    .loading-wrap {
        padding: 120px 0;
        text-align: center;
    }
    .loading-dot {
        width: 12px;
        height: 12px;
        background: #C9A84C;
        border-radius: 50%;
        margin: 0 auto 24px;
        animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.35; transform: scale(0.75); }
    }
    .loading-text {
        font-size: 15px;
        color: #6e6e73;
        font-weight: 400;
    }

    /* ── Spinner override ── */
    [data-testid="stSpinner"] > div {
        border-top-color: #C9A84C !important;
    }

    /* ── Dataframe ── */
    [data-testid="stDataFrame"] {
        background: transparent !important;
    }
</style>
""", unsafe_allow_html=True)


def init_session():
    if "call_log" not in st.session_state:
        st.session_state["call_log"] = []
    if "board_result" not in st.session_state:
        st.session_state["board_result"] = None
    if "problem_text" not in st.session_state:
        st.session_state["problem_text"] = ""


def render_landing():
    chunk_count = board.get_chunk_count()

    st.markdown("""
        <div class="hero-wrap">
            <div class="eyebrow">Powered by Lenny's Podcast</div>
            <div class="hero-headline">Your board of advisors.<br>Assembled from the best.</div>
            <div class="hero-sub">Five advisors from Lenny's podcast will debate your toughest product problem.</div>
        </div>
    """, unsafe_allow_html=True)

    if chunk_count == 0:
        st.markdown(
            '<div class="warning-banner">⚠️ <strong>Archive not loaded.</strong> Run <code>python ingest.py</code> in the shell to load Lenny\'s archive.</div>',
            unsafe_allow_html=True
        )
    elif chunk_count == -1:
        st.markdown(
            '<div class="warning-banner">⚠️ Could not connect to Supabase. Check your SUPABASE_URL and SUPABASE_KEY secrets.</div>',
            unsafe_allow_html=True
        )

    problem = st.text_area(
        "Your problem",
        value=st.session_state.get("problem_text", ""),
        placeholder="Describe your product problem. The more specific, the sharper the advice.",
        height=140,
        label_visibility="collapsed",
        key="problem_input"
    )

    col_btn, _ = st.columns([1, 3])
    with col_btn:
        if st.button("Assemble Your Board →", key="assemble_btn", use_container_width=False):
            if problem.strip():
                st.session_state["problem_text"] = problem
                run_board(problem.strip())
            else:
                st.warning("Please describe your product problem first.")

    st.markdown('<div class="chip-label">Or try an example</div>', unsafe_allow_html=True)

    cols = st.columns(len(config.EXAMPLE_PROBLEMS))
    for i, example in enumerate(config.EXAMPLE_PROBLEMS):
        with cols[i]:
            if st.button(example, key=f"chip_{i}", use_container_width=True):
                st.session_state["problem_text"] = example
                st.rerun()


def run_board(problem: str):
    st.session_state["call_log"] = []

    steps = [
        "Reading your situation…",
        "Scanning episodes for the right advisors…",
        "Assembling your board…",
        "Preparing their perspectives…",
    ]

    placeholder = st.empty()

    def show_step(msg):
        placeholder.markdown(f"""
            <div class="loading-wrap">
                <div class="loading-dot"></div>
                <div class="loading-text">{msg}</div>
            </div>
        """, unsafe_allow_html=True)

    show_step(steps[0])
    analysis = board.analyze_problem(problem)

    show_step(steps[1])
    chunks = board.retrieve_chunks(analysis.get("search_queries", [problem]))

    show_step(steps[2])
    board_members = board.select_board(problem, chunks)

    show_step(steps[3])
    responses = board.generate_all_responses(board_members, problem)
    debate = board.generate_debate(board_members, responses)
    synthesis = board.generate_synthesis(problem, board_members, responses)

    placeholder.empty()

    st.session_state["board_result"] = {
        "problem": problem,
        "board_members": board_members,
        "responses": responses,
        "debate": debate,
        "synthesis": synthesis
    }
    st.rerun()


def render_board():
    result = st.session_state["board_result"]
    problem = result["problem"]
    board_members = result["board_members"]
    responses = result["responses"]
    debate = result["debate"]
    synthesis = result["synthesis"]

    st.markdown(f"""
        <div class="board-header">
            <div class="board-eyebrow">Your Board</div>
            <div class="board-headline">Five advisors. One problem.</div>
            <div class="board-problem">{problem}</div>
        </div>
    """, unsafe_allow_html=True)

    row1 = board_members[:3]
    row2 = board_members[3:]

    cols1 = st.columns(3, gap="medium")
    for i, member in enumerate(row1):
        with cols1[i]:
            render_member_card(member, responses[i])

    if row2:
        _, col_a, col_b, _ = st.columns([0.5, 1, 1, 0.5], gap="medium")
        for col, member in zip([col_a, col_b], row2):
            with col:
                render_member_card(member, responses[board_members.index(member)])

    st.markdown('<hr class="section-divider">', unsafe_allow_html=True)
    st.markdown('<div class="section-label">The Debate</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="debate-box">{debate}</div>', unsafe_allow_html=True)

    st.markdown('<hr class="section-divider">', unsafe_allow_html=True)
    st.markdown('<div class="section-label">Board Synthesis</div>', unsafe_allow_html=True)
    render_synthesis(synthesis)

    st.markdown('<hr class="section-divider">', unsafe_allow_html=True)

    col_src, col_stats = st.columns(2, gap="medium")
    with col_src:
        with st.expander("Sources"):
            for member in board_members:
                title = member.get("title", "Lenny's Podcast")
                date = member.get("date", "")
                date_str = f" · {date}" if date else ""
                st.markdown(
                    f'<span style="color:#f5f5f7;font-weight:600;">{member["guest_name"]}</span>'
                    f'<span style="color:#6e6e73;font-size:13px;"> — {title}{date_str}</span>',
                    unsafe_allow_html=True
                )

    with col_stats:
        with st.expander("Session Stats"):
            call_log = st.session_state.get("call_log", [])
            if call_log:
                import pandas as pd
                df = pd.DataFrame(call_log)
                total_cost = df["cost_usd"].sum()
                st.dataframe(df, use_container_width=True)
                st.markdown(
                    f'<div style="font-size:13px;color:#6e6e73;margin-top:8px;">Total: '
                    f'<span style="color:#f5f5f7;font-weight:600;">${total_cost:.4f}</span></div>',
                    unsafe_allow_html=True
                )
            else:
                st.markdown('<span style="font-size:13px;color:#6e6e73;">No calls logged yet.</span>', unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("← Bring a new problem", key="new_problem_btn"):
        st.session_state["board_result"] = None
        st.session_state["call_log"] = []
        st.session_state["problem_text"] = ""
        st.rerun()


def render_member_card(member: dict, response: str):
    role = member["role"]
    guest_name = member["guest_name"]
    guest_title = config.GUEST_TITLES.get(guest_name, "Product Leader")

    safe_response = response.replace("<", "&lt;").replace(">", "&gt;")

    st.markdown(
        f'<div class="board-card">'
        f'<div class="role-label">{role}</div>'
        f'<div class="guest-name">{guest_name}</div>'
        f'<div class="guest-title-text">{guest_title}</div>'
        f'<div class="response-text">{safe_response}</div>'
        f'<div class="citation">— {guest_name}, Lenny\'s Podcast</div>'
        f'</div>',
        unsafe_allow_html=True
    )


def render_synthesis(synthesis_text: str):
    current_label = None
    current_text = []
    sections = {}
    labels = ["What the board agrees on", "The open question", "Your next move"]

    for line in synthesis_text.split("\n"):
        line = line.strip()
        if not line:
            continue
        matched = False
        for label in labels:
            clean_line = re.sub(r'\*+', '', line).strip()
            if clean_line.lower().startswith(label.lower()):
                if current_label:
                    sections[current_label] = " ".join(current_text).strip()
                current_label = label
                current_text = [re.sub(r'^\*?' + label + r'\*?:?\s*', '', clean_line, flags=re.IGNORECASE).strip()]
                matched = True
                break
        if not matched and current_label:
            current_text.append(line)

    if current_label:
        sections[current_label] = " ".join(current_text).strip()

    sections_html = ""
    for label in labels:
        text = sections.get(label, "")
        safe_text = text.replace("<", "&lt;").replace(">", "&gt;")
        sections_html += (
            f'<div class="synthesis-section">'
            f'<div class="synthesis-eyebrow">{label}</div>'
            f'<div class="synthesis-text">{safe_text}</div>'
            f'</div>'
        )

    st.markdown(
        f'<div class="synthesis-card">{sections_html}</div>',
        unsafe_allow_html=True
    )


def main():
    init_session()

    if st.session_state["board_result"] is not None:
        render_board()
    else:
        render_landing()


if __name__ == "__main__":
    main()

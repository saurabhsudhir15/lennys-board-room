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
    /* Global background */
    .stApp {
        background-color: #0D1B2A;
        color: #FFFFFF;
    }
    [data-testid="stAppViewContainer"] {
        background-color: #0D1B2A;
    }
    [data-testid="stHeader"] {
        background-color: #0D1B2A;
    }
    section[data-testid="stSidebar"] {
        background-color: #0D1B2A;
    }

    /* Text */
    .stApp, .stApp p, .stApp label, .stApp span {
        color: #FFFFFF;
    }

    /* Main title */
    .main-title {
        font-size: 2.8rem;
        font-weight: 800;
        color: #C9A84C;
        margin-bottom: 0.2rem;
    }
    .main-subtitle {
        font-size: 1.1rem;
        color: #AABBC8;
        margin-bottom: 2rem;
    }

    /* Gold divider */
    .gold-divider {
        border: none;
        border-top: 2px solid #C9A84C;
        margin: 1.5rem 0;
    }

    /* Board member card */
    .board-card {
        background-color: #142130;
        border: 1px solid #1E3045;
        border-radius: 10px;
        padding: 1.2rem;
        margin-bottom: 1rem;
        height: 100%;
    }

    /* Role badge */
    .role-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.6rem;
        color: #FFFFFF;
    }

    /* Guest name */
    .guest-name {
        font-size: 1.1rem;
        font-weight: 700;
        color: #FFFFFF;
        margin-bottom: 0.1rem;
    }
    .guest-title {
        font-size: 0.82rem;
        color: #7899B0;
        margin-bottom: 0.8rem;
    }

    /* Response text */
    .response-text {
        font-size: 0.92rem;
        line-height: 1.65;
        color: #D4E3EE;
    }
    .citation {
        font-size: 0.8rem;
        color: #7899B0;
        font-style: italic;
        margin-top: 0.8rem;
    }

    /* Debate box */
    .debate-box {
        background-color: #142130;
        border-left: 4px solid #C9A84C;
        border-radius: 4px;
        padding: 1rem 1.2rem;
        margin: 1rem 0;
        color: #D4E3EE;
        font-size: 0.95rem;
        line-height: 1.65;
    }

    /* Synthesis card */
    .synthesis-card {
        background-color: #F5F5F5;
        border-radius: 10px;
        padding: 1.5rem;
        margin: 1rem 0;
        color: #0D1B2A;
    }
    .synthesis-label {
        font-weight: 700;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #C9A84C;
        margin-bottom: 0.3rem;
    }
    .synthesis-text {
        font-size: 0.95rem;
        line-height: 1.7;
        color: #1A2A38;
        margin-bottom: 1.2rem;
    }

    /* Chips */
    .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 1.2rem;
    }

    /* Textarea */
    .stTextArea textarea {
        background-color: #142130 !important;
        color: #FFFFFF !important;
        border: 1px solid #2A4060 !important;
        border-radius: 8px;
        font-size: 1rem;
    }

    /* Buttons */
    .stButton > button {
        background-color: #C9A84C;
        color: #0D1B2A;
        font-weight: 700;
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1.5rem;
    }
    .stButton > button:hover {
        background-color: #b8963e;
        color: #0D1B2A;
    }

    /* Warning */
    .warning-banner {
        background-color: #3D2000;
        border: 1px solid #C9A84C;
        border-radius: 8px;
        padding: 0.8rem 1rem;
        color: #F5D98A;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }

    /* Expander */
    .streamlit-expanderHeader {
        color: #C9A84C !important;
        background-color: #142130 !important;
    }
    [data-testid="stExpander"] {
        border: 1px solid #1E3045;
        border-radius: 8px;
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
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
    st.markdown('<div class="main-title">Lenny\'s Board of Directors</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="main-subtitle">Bring your toughest product problem. Your board — assembled from Lenny\'s podcast guests — will debate it.</div>',
        unsafe_allow_html=True
    )

    chunk_count = board.get_chunk_count()
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

    st.markdown("**Try an example:**")
    cols = st.columns(len(config.EXAMPLE_PROBLEMS))
    for i, example in enumerate(config.EXAMPLE_PROBLEMS):
        with cols[i]:
            if st.button(example, key=f"chip_{i}", use_container_width=True):
                st.session_state["problem_text"] = example
                st.rerun()

    problem = st.text_area(
        "Your problem",
        value=st.session_state.get("problem_text", ""),
        placeholder="Describe your product problem. The more specific you are, the sharper the advice.",
        height=140,
        label_visibility="collapsed",
        key="problem_input"
    )

    if st.button("Assemble Your Board", use_container_width=False):
        if problem.strip():
            st.session_state["problem_text"] = problem
            run_board(problem.strip())
        else:
            st.warning("Please describe your product problem first.")


def run_board(problem: str):
    st.session_state["call_log"] = []

    with st.spinner("Reading your situation..."):
        analysis = board.analyze_problem(problem)

    with st.spinner("Scanning episodes for the right advisors..."):
        chunks = board.retrieve_chunks(analysis.get("search_queries", [problem]))

    with st.spinner("Assembling your board..."):
        board_members = board.select_board(problem, chunks)

    with st.spinner("Preparing their perspectives..."):
        responses = board.generate_all_responses(board_members, problem)
        debate = board.generate_debate(board_members, responses)
        synthesis = board.generate_synthesis(problem, board_members, responses)

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

    st.markdown('<div class="main-title">Your Board</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="main-subtitle">Problem: <em>{problem}</em></div>', unsafe_allow_html=True)
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

    row1 = board_members[:3]
    row2 = board_members[3:]

    cols1 = st.columns(3)
    for i, member in enumerate(row1):
        with cols1[i]:
            render_member_card(member, responses[i])

    if row2:
        gap_col, col_a, col_b, gap_col2 = st.columns([0.5, 1, 1, 0.5])
        for col, member in zip([col_a, col_b], row2):
            with col:
                render_member_card(member, responses[board_members.index(member)])

    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    st.markdown("### The Debate")
    st.markdown(f'<div class="debate-box">{debate}</div>', unsafe_allow_html=True)

    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    st.markdown("### Board Synthesis")
    render_synthesis(synthesis)

    with st.expander("Sources"):
        for member in board_members:
            title = member.get("title", "Lenny's Podcast")
            date = member.get("date", "")
            date_str = f" · {date}" if date else ""
            st.markdown(f"**{member['guest_name']}** — *{title}{date_str}*")

    with st.expander("Session Stats"):
        call_log = st.session_state.get("call_log", [])
        if call_log:
            import pandas as pd
            df = pd.DataFrame(call_log)
            total_cost = df["cost_usd"].sum()
            st.dataframe(df, use_container_width=True)
            st.markdown(f"**Total session cost: ${total_cost:.4f}**")
        else:
            st.write("No calls logged yet.")

    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    if st.button("Bring a new problem"):
        st.session_state["board_result"] = None
        st.session_state["call_log"] = []
        st.session_state["problem_text"] = ""
        st.rerun()


def render_member_card(member: dict, response: str):
    role = member["role"]
    guest_name = member["guest_name"]
    role_color = config.BOARD_ROLES.get(role, {}).get("color", "#666")
    guest_title = config.GUEST_TITLES.get(guest_name, "Product Leader")

    st.markdown(
        f'<div class="board-card">'
        f'<span class="role-badge" style="background-color:{role_color};">{role}</span>'
        f'<div class="guest-name">{guest_name}</div>'
        f'<div class="guest-title">{guest_title}</div>'
        f'<div class="response-text">{response}</div>'
        f'<div class="citation">— {guest_name}, Lenny\'s Podcast</div>'
        f'</div>',
        unsafe_allow_html=True
    )


def render_synthesis(synthesis_text: str):
    labels = {
        "What the board agrees on": None,
        "The open question": None,
        "Your next move": None
    }

    import re
    current_label = None
    current_text = []
    sections = {}

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

    card_html = '<div class="synthesis-card">'
    for label in ["What the board agrees on", "The open question", "Your next move"]:
        text = sections.get(label, "")
        card_html += f'<div class="synthesis-label">{label}</div>'
        card_html += f'<div class="synthesis-text">{text}</div>'
    card_html += '</div>'

    st.markdown(card_html, unsafe_allow_html=True)


def main():
    init_session()

    if st.session_state["board_result"] is not None:
        render_board()
    else:
        render_landing()


if __name__ == "__main__":
    main()

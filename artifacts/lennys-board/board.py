import concurrent.futures
import streamlit as st
from openai import OpenAI
from supabase import create_client
import os
import config

_openai_client = None
_supabase_client = None


def get_openai():
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _openai_client


def get_supabase():
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"]
        )
    return _supabase_client


def log_call(task, model, input_tokens, output_tokens):
    pricing = config.MODEL_PRICING.get(model, {"input": 0, "output": 0})
    cost = (input_tokens / 1_000_000 * pricing["input"]) + (
        output_tokens / 1_000_000 * pricing["output"]
    )
    entry = {
        "task": task,
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": round(cost, 6),
    }
    if "call_log" not in st.session_state:
        st.session_state["call_log"] = []
    st.session_state["call_log"].append(entry)
    return cost


def get_chunk_count():
    try:
        sb = get_supabase()
        result = sb.table("lenny_chunks").select("id", count="exact").execute()
        return result.count or 0
    except Exception:
        return -1


def analyze_problem(problem: str) -> dict:
    client = get_openai()
    response = client.chat.completions.create(
        model=config.ANALYSIS_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a product strategy expert. Analyze the given product problem and return a JSON object with two fields:\n"
                    "1. 'problem_type': one of: metrics/growth, prioritization, stakeholder management, go-to-market, execution, product strategy, team/culture, product-market fit\n"
                    "2. 'search_queries': a list of 3-5 search strings to find the most relevant podcast content about this problem.\n"
                    "Return only valid JSON, no markdown."
                ),
            },
            {"role": "user", "content": f"Product problem: {problem}"},
        ],
        response_format={"type": "json_object"},
    )
    usage = response.usage
    log_call(
        "analyze_problem",
        config.ANALYSIS_MODEL,
        usage.prompt_tokens,
        usage.completion_tokens,
    )
    import json

    return json.loads(response.choices[0].message.content)


def _embed(text: str) -> list:
    client = get_openai()
    resp = client.embeddings.create(
        model=config.EMBED_MODEL, input=text, dimensions=config.EMBED_DIMENSIONS
    )
    return resp.data[0].embedding


def retrieve_chunks(search_queries: list) -> list:
    sb = get_supabase()
    all_chunks = []
    for query in search_queries:
        embedding = _embed(query)
        try:
            result = sb.rpc(
                "match_chunks", {"query_embedding": embedding, "match_count": 10}
            ).execute()
            if result.data:
                all_chunks.extend(result.data)
        except Exception:
            pass

    seen_guests = {}
    for chunk in all_chunks:
        guest = chunk.get("guest_name", "")
        sim = chunk.get("similarity", 0)
        if guest not in seen_guests or sim > seen_guests[guest].get("similarity", 0):
            seen_guests[guest] = chunk

    sorted_chunks = sorted(
        seen_guests.values(), key=lambda x: x.get("similarity", 0), reverse=True
    )
    return sorted_chunks[:10]


def select_board(problem: str, chunks: list) -> list:
    import json

    client = get_openai()

    guest_summaries = []
    for c in chunks:
        guest_summaries.append(
            {
                "guest_name": c.get("guest_name", ""),
                "title": c.get("title", ""),
                "date": c.get("date", ""),
                "snippet": c.get("content", "")[:300],
            }
        )

    roles = list(config.BOARD_ROLES.keys())

    response = client.chat.completions.create(
        model=config.ANALYSIS_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are assembling a 5-person advisory board from Lenny's podcast guests to advise on a product problem.\n"
                    f"Available roles: {roles}\n"
                    f"Select 5 distinct guests from the list provided. Assign each a role that best fits their expertise.\n"
                    f"Return a JSON array of 5 objects, each with: guest_name, role, chunk_content (the snippet), title, date.\n"
                    f"Return only valid JSON array, no markdown."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Problem: {problem}\n\n"
                    f"Available guests:\n{json.dumps(guest_summaries, indent=2)}"
                ),
            },
        ],
        response_format={"type": "json_object"},
    )
    usage = response.usage
    log_call(
        "select_board",
        config.ANALYSIS_MODEL,
        usage.prompt_tokens,
        usage.completion_tokens,
    )

    raw = json.loads(response.choices[0].message.content)
    board = []
    if isinstance(raw, list):
        board = raw
    elif isinstance(raw, dict):
        for key in ["board", "members", "advisors", "board_members"]:
            if key in raw and isinstance(raw[key], list):
                board = raw[key]
                break
        if not board:
            board = next((v for v in raw.values() if isinstance(v, list)), [])
    board = [
        m for m in board if isinstance(m, dict) and "guest_name" in m and "role" in m
    ]

    if len(board) < 5:
        existing_names = {m["guest_name"] for m in board}
        existing_roles = {m["role"] for m in board}
        for fallback in config.FALLBACK_GUESTS:
            if len(board) >= 5:
                break
            if fallback not in existing_names:
                available_roles = [r for r in roles if r not in existing_roles]
                role = (
                    available_roles[0]
                    if available_roles
                    else roles[len(board) % len(roles)]
                )
                board.append(
                    {
                        "guest_name": fallback,
                        "role": role,
                        "chunk_content": f"Known product leader featured on Lenny's Podcast.",
                        "title": "Lenny's Podcast",
                        "date": "",
                    }
                )
                existing_names.add(fallback)
                existing_roles.add(role)

    return board[:5]


def generate_board_response(
    guest_name: str, role: str, role_description: str, chunk: str, problem: str
) -> str:
    client = get_openai()
    response = client.chat.completions.create(
        model=config.BOARD_MEMBER_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are {guest_name}, speaking from your experience as a product leader "
                    f"and your appearances on Lenny's Podcast. Your board role is {role}: {role_description}. "
                    f"Speak in your authentic voice. Be direct, specific, reference your actual frameworks. "
                    f"You have a distinct point of view — you do not need to agree with others."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"A PM has brought this problem to the board: {problem}\n\n"
                    f"The most relevant insights from your conversations with Lenny:\n{chunk}\n\n"
                    f"Give your board perspective in 150-180 words. Lead with your sharpest insight. "
                    f"Be opinionated. End with one specific action."
                ),
            },
        ],
    )
    usage = response.usage
    log_call(
        f"board_response:{guest_name}",
        config.BOARD_MEMBER_MODEL,
        usage.prompt_tokens,
        usage.completion_tokens,
    )
    return response.choices[0].message.content


def generate_all_responses(board_members: list, problem: str) -> list:
    responses = [None] * len(board_members)

    def fetch(idx, member):
        role = member["role"]
        role_desc = config.BOARD_ROLES.get(role, {}).get("description", "")
        chunk = member.get("chunk_content", "")
        return idx, generate_board_response(
            member["guest_name"], role, role_desc, chunk, problem
        )

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch, i, m): i for i, m in enumerate(board_members)}
        for future in concurrent.futures.as_completed(futures):
            idx, resp = future.result()
            responses[idx] = resp

    return responses


def generate_debate(board_members: list, responses: list) -> str:
    import json

    client = get_openai()

    pairs = []
    for i, m in enumerate(board_members):
        pairs.append(
            {"guest": m["guest_name"], "role": m["role"], "response": responses[i]}
        )

    response = client.chat.completions.create(
        model=config.BOARD_MEMBER_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a skilled facilitator. Identify the two most philosophically opposed board members "
                    "based on their perspectives. Write 2-3 sentences capturing the core tension between them.\n"
                    "Format: '[Guest A] pushes back on [Guest B]: [2-3 sentence tension description]'"
                ),
            },
            {
                "role": "user",
                "content": f"Board responses:\n{json.dumps(pairs, indent=2)}",
            },
        ],
    )
    usage = response.usage
    log_call(
        "generate_debate",
        config.BOARD_MEMBER_MODEL,
        usage.prompt_tokens,
        usage.completion_tokens,
    )
    return response.choices[0].message.content


def generate_synthesis(problem: str, board_members: list, responses: list) -> str:
    import json

    client = get_openai()

    pairs = []
    for i, m in enumerate(board_members):
        pairs.append(
            {"guest": m["guest_name"], "role": m["role"], "response": responses[i]}
        )

    response = client.chat.completions.create(
        model=config.SYNTHESIS_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are synthesizing advice from a 5-person advisory board for a PM. "
                    "Write exactly 3 paragraphs with these labels:\n"
                    "**What the board agrees on:** [paragraph]\n"
                    "**The open question:** [paragraph — the key tension they did not resolve, which the PM must decide]\n"
                    "**Your next move:** [paragraph — the single most important next action]\n"
                    "Be specific, decisive, and direct."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"PM's problem: {problem}\n\n"
                    f"Board responses:\n{json.dumps(pairs, indent=2)}"
                ),
            },
        ],
    )
    usage = response.usage
    log_call(
        "generate_synthesis",
        config.SYNTHESIS_MODEL,
        usage.prompt_tokens,
        usage.completion_tokens,
    )
    return response.choices[0].message.content

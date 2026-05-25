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
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SECRET_KEY"]
        )
    return _supabase_client


def log_call(task, model, input_tokens, output_tokens):
    pricing = config.MODEL_PRICING.get(model, {"input": 0, "output": 0})
    cost = (input_tokens / 1_000_000 * pricing["input"]) + \
           (output_tokens / 1_000_000 * pricing["output"])
    entry = {
        "task": task,
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": round(cost, 6)
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
                )
            },
            {"role": "user", "content": f"Product problem: {problem}"}
        ],
        response_format={"type": "json_object"}
    )
    usage = response.usage
    log_call("analyze_problem", config.ANALYSIS_MODEL, usage.prompt_tokens, usage.completion_tokens)
    import json
    return json.loads(response.choices[0].message.content)


def _embed(text: str) -> list:
    client = get_openai()
    resp = client.embeddings.create(
        model=config.EMBED_MODEL,
        input=text,
        dimensions=config.EMBED_DIMENSIONS
    )
    return resp.data[0].embedding


def retrieve_chunks(search_queries: list) -> list:
    sb = get_supabase()
    all_chunks = []
    for query in search_queries:
        embedding = _embed(query)
        vec_str = "[" + ",".join(str(x) for x in embedding) + "]"
        try:
            result = sb.rpc("match_chunks", {
                "query_embedding": vec_str,
                "match_count": 10
            }).execute()
            if result.data:
                all_chunks.extend(result.data)
        except Exception as e:
            print(f"retrieve_chunks error for '{query[:50]}': {e}")

    seen_guests = {}
    for chunk in all_chunks:
        guest = chunk.get("guest_name", "")
        sim = chunk.get("similarity", 0)
        if guest not in seen_guests or sim > seen_guests[guest].get("similarity", 0):
            seen_guests[guest] = chunk

    sorted_chunks = sorted(seen_guests.values(), key=lambda x: x.get("similarity", 0), reverse=True)
    return sorted_chunks[:10]


def select_board(problem: str, chunks: list) -> list:
    import json
    client = get_openai()

    EXCLUDE_FROM_BOARD = {"Lenny Rachitsky"}

    guest_summaries = []
    for c in chunks:
        if c.get("guest_name", "") in EXCLUDE_FROM_BOARD:
            continue
        guest_summaries.append({
            "guest_name": c.get("guest_name", ""),
            "title": c.get("title", ""),
            "date": c.get("date", ""),
            "snippet": c.get("content", "")[:300]
        })

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
                    f"Return a JSON object with a 'board' key containing an array of exactly 5 objects, "
                    f"each with: guest_name, role, chunk_content (copy the snippet exactly), title, date.\n"
                    f"Return only valid JSON object, no markdown."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Problem: {problem}\n\n"
                    f"Available guests:\n{json.dumps(guest_summaries, indent=2)}"
                )
            }
        ],
        response_format={"type": "json_object"}
    )
    usage = response.usage
    log_call("select_board", config.ANALYSIS_MODEL, usage.prompt_tokens, usage.completion_tokens)

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

    board = [m for m in board if isinstance(m, dict) and "guest_name" in m and "role" in m and len(m.get("chunk_content", "")) > 50]

    if len(board) < 5:
        existing_names = {m["guest_name"] for m in board}
        existing_roles = {m["role"] for m in board}
        for fallback in config.FALLBACK_GUESTS:
            if len(board) >= 5:
                break
            if fallback not in existing_names:
                available_roles = [r for r in roles if r not in existing_roles]
                role = available_roles[0] if available_roles else roles[len(board) % len(roles)]
                board.append({
                    "guest_name": fallback,
                    "role": role,
                    "chunk_content": f"Known product leader featured on Lenny's Podcast.",
                    "title": "Lenny's Podcast",
                    "date": ""
                })
                existing_names.add(fallback)
                existing_roles.add(role)

    # Deduplicate by guest_name — replace any duplicate with next unused chunk
    seen_names = {}
    deduped = []
    for member in board:
        name = member["guest_name"]
        if name not in seen_names:
            seen_names[name] = True
            deduped.append(member)
        else:
            for chunk in chunks:
                chunk_name = chunk.get("guest_name", "")
                if chunk_name and chunk_name not in seen_names:
                    member_copy = dict(member)
                    member_copy["guest_name"] = chunk_name
                    member_copy["chunk_content"] = chunk.get("content", "")[:300]
                    member_copy["title"] = chunk.get("title", "")
                    member_copy["date"] = chunk.get("date", "")
                    deduped.append(member_copy)
                    seen_names[chunk_name] = True
                    break

    return deduped[:5]


def generate_board_response(guest_name: str, role: str, role_description: str, chunk: str, problem: str) -> str:
    client = get_openai()
    response = client.chat.completions.create(
        model=config.BOARD_MEMBER_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are {guest_name}, speaking from your experience as a product leader "
                    f"and your appearances on Lenny's Podcast. Your board role is {role}: {role_description}. "
                    f"Speak in your authentic voice. Reference your actual frameworks and specific experiences."
                    f"You disagree when your perspective demands it — agreement is not your job."
                    f"The PM brought a hard problem; give them a hard answer."
                )
            },
            {
                "role": "user",
                "content": (
                    f"A PM has brought this problem to the board: {problem}\n\n"
                    f"The most relevant insights from your conversations with Lenny:\n{chunk}\n\n"
                    f"You must reference at least one specific idea, framework, or phrase from the transcript above. "
                    f"Do not invent opinions not present in the excerpt.\n\n"
                    f"Your analytical lens must be distinctly yours — rooted in your specific background and the transcript above. "
                    f"Do not reach for frameworks any PM would use (user interviews, cohort analysis, OKRs, Jobs to Be Done). "
                    f"If another board member could give the same advice, it is not sharp enough.\n\n"
                    f"Give your board perspective in 150-180 words. Lead with your sharpest insight. "
                    f"Be opinionated. End with one specific action."
                )
            }
        ]
    )
    usage = response.usage
    log_call(f"board_response:{guest_name}", config.BOARD_MEMBER_MODEL, usage.prompt_tokens, usage.completion_tokens)
    return response.choices[0].message.content


def generate_all_responses(board_members: list, problem: str) -> list:
    responses = [None] * len(board_members)

    def fetch(idx, member):
        role = member["role"]
        role_desc = config.BOARD_ROLES.get(role, {}).get("description", "")
        chunk = member.get("chunk_content", "")
        return idx, generate_board_response(member["guest_name"], role, role_desc, chunk, problem)

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch, i, m): i for i, m in enumerate(board_members)}
        for future in concurrent.futures.as_completed(futures):
            idx, resp = future.result()
            responses[idx] = resp

    return responses


def _extract_debaters(debate_text: str, board_members: list) -> tuple:
    first_line = debate_text.split('\n')[0]
    if ' to ' in first_line:
        parts = first_line.split(' to ', 1)
        name1 = parts[0].strip()
        name2 = parts[1].split(':')[0].strip()
        return name1, name2
    return board_members[0]['guest_name'], board_members[1]['guest_name']


def generate_debate(board_members, responses):
    client = get_openai()
    board_summary = "\n\n".join([
        f"{m['guest_name']} ({m['role']}): {r}"
        for m, r in zip(board_members, responses)
    ])
    lines = [
        "Five product advisors have just given their perspectives on a PM problem:",
        "",
        board_summary,
        "",
        "Find the two advisors whose recommendations are most directly incompatible - not just different emphasis, but genuinely conflicting calls to action.",
        "",
        (
            "Write a direct verbal exchange in exactly this structure:\n"
            "FIRST_ADVISOR_NAME to SECOND_ADVISOR_NAME: First advisor directly challenges "
            "what the second advisor specifically recommended. 2-3 sentences. "
            "Name what they said. Explain why it is the wrong call for this specific situation.\n"
            "SECOND_ADVISOR_NAME: Second advisor holds their ground or sharpens their position. "
            "1-2 sentences."
        ),
        "",
        "Rules:",
        "- Use their real names from the responses above",
        "- First-person direct speech only. No narration. Do not write X thinks that Y...",
        "- Reference what the other person actually said, not their role in general",
        "- No softening. No I see your point but... This is a real debate",
        "- Exactly 2 lines. Nothing else.",
    ]
    prompt = "\n".join(lines)

    response = client.chat.completions.create(
        model=config.BOARD_MEMBER_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.7,
    )
    result = response.choices[0].message.content.strip()
    log_call("generate_debate", config.BOARD_MEMBER_MODEL,
             response.usage.prompt_tokens, response.usage.completion_tokens)

    debater1, debater2 = _extract_debaters(result, board_members)
    return {"text": result, "clash": [debater1, debater2]}


def generate_synthesis(problem: str, board_members: list, responses: list, clash_names: list = None) -> str:
    import json
    client = get_openai()

    pairs = []
    for i, m in enumerate(board_members):
        pairs.append({"guest": m["guest_name"], "role": m["role"], "response": responses[i]})

    clash_instruction = ""
    if clash_names and len(clash_names) >= 2:
        clash_instruction = (
            f"The live debate already surfaced the sharpest conflict: it is between "
            f"{clash_names[0]} and {clash_names[1]}. "
            f"Paragraph 2 must describe the tension between exactly these two people — "
            f"name them, state their incompatible positions, and make clear the PM must choose one.\n\n"
        )

    response = client.chat.completions.create(
        model=config.SYNTHESIS_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are synthesizing advice from a 5-person advisory board for a PM. "
                    "Write exactly 3 plain paragraphs separated by blank lines.\n\n"
                    "Paragraph 1: What the board agrees on. One clear sentence. No hedging.\n\n"
                    f"{clash_instruction}"
                    "Paragraph 2: The sharpest unresolved tension. "
                    "State the two conflicting positions explicitly. Do not soften it. "
                    "The PM cannot do both — they must choose one.\n\n"
                    "Paragraph 3: The single most important next action. "
                    "Not a research plan. A decision, a bet, or a cut. "
                    "Something that would actually change the trajectory this week.\n\n"
                    "No bold text, no labels, no headers, no bullet points. Plain paragraphs only."
                )
            },
            {
                "role": "user",
                "content": (
                    f"PM's problem: {problem}\n\n"
                    f"Board responses:\n{json.dumps(pairs, indent=2)}"
                )
            }
        ]
    )
    usage = response.usage
    log_call("generate_synthesis", config.SYNTHESIS_MODEL, usage.prompt_tokens, usage.completion_tokens)
    return response.choices[0].message.content


def generate_lenny_insight(problem: str, board_members: list, responses: list, chunks: list) -> str:
    import json
    client = get_openai()

    board_summary = "\n\n".join([
        f"{m['guest_name']} ({m['role']}): {r}"
        for m, r in zip(board_members, responses)
    ])

    chunk_excerpts = "\n\n".join([
        f"[{c.get('guest_name', '')} — {c.get('title', '')}]\n{c.get('content', '')[:400]}"
        for c in chunks[:8]
    ])

    response = client.chat.completions.create(
        model=config.SYNTHESIS_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Lenny Rachitsky — you have spent 7 years interviewing the best product minds in the world. "
                    "You have now watched 5 of your past guests debate a PM's problem. "
                    "Your job is to give the one insight that none of them could give individually — "
                    "the pattern you have seen play out across dozens of these conversations. "
                    "Draw from what YOU said, asked, or observed in the transcript excerpts below, "
                    "and from your newsletter writing. Not what the guests said — what YOU noticed.\n\n"
                    "Rules:\n"
                    "- 2-3 sentences only\n"
                    "- Speak in first person as Lenny\n"
                    "- Name the pattern explicitly — do not hint at it\n"
                    "- Reference the specific tension the board just surfaced\n"
                    "- No flattery, no throat-clearing, no 'great discussion'"
                )
            },
            {
                "role": "user",
                "content": (
                    f"The PM's problem: {problem}\n\n"
                    f"What the board just said:\n{board_summary}\n\n"
                    f"Excerpts from your conversations and newsletters:\n{chunk_excerpts}"
                )
            }
        ],
        max_tokens=150,
        temperature=0.7,
    )
    usage = response.usage
    log_call("lenny_insight", config.SYNTHESIS_MODEL, usage.prompt_tokens, usage.completion_tokens)
    return response.choices[0].message.content.strip()




def generate_pick_your_move(problem: str, board_members: list, responses: list) -> list:
    import json as _json
    client = get_openai()
    pairs = [
        {"guest": m["guest_name"], "role": m["role"], "response": responses[i]}
        for i, m in enumerate(board_members)
    ]
    response = client.chat.completions.create(
        model=config.SYNTHESIS_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are generating 3 distinct action options for a PM based on their board's advice. "
                    "Each option must be a genuinely different bet - not variations of the same approach. "
                    'Return valid JSON only: {"moves": [<3 objects>]}. '
                    "Each object must have: "
                    "title (2-4 words, the name of the move), "
                    "action (what to actually do, 1-2 sentences), "
                    "reasoning (why this is the right bet for this situation, 1-2 sentences), "
                    "backed_by (the board member whose thinking drives this option, first name + last name only)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"PM's problem: {problem}\n\n"
                    f"Board responses:\n{_json.dumps(pairs, indent=2)}\n\n"
                    "Identify the sharpest unresolved tension in the board's responses, then generate 3 moves "
                    "that reflect genuinely different strategic bets. "
                    "One should be the bold structural move. One should be the execution-first move. "
                    "One should be the reframe move."
                )
            }
        ],
        response_format={"type": "json_object"},
    )
    log_call("pick_your_move", config.SYNTHESIS_MODEL,
             response.usage.prompt_tokens, response.usage.completion_tokens)
    data = _json.loads(response.choices[0].message.content)
    moves = data.get("moves", [])
    return moves[:3]
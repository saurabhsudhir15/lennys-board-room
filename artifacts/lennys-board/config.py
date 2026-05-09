# --- LLM Models ---
BOARD_MEMBER_MODEL = "gpt-4o-mini"
SYNTHESIS_MODEL = "gpt-4o"
ANALYSIS_MODEL = "gpt-4o-mini"
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMENSIONS = 1536

# --- Model Pricing (per 1M tokens, for observability logging only) ---
MODEL_PRICING = {
    "gpt-4o":      {"input": 2.50,  "output": 10.00},
    "gpt-4o-mini": {"input": 0.15,  "output": 0.60},
}

# --- Board Roles ---
BOARD_ROLES = {
    "Challenger": {
        "color": "#E63946",
        "description": "Questions the problem framing before solving it. Surfaces hidden assumptions. Will reframe the entire question."
    },
    "Operator": {
        "color": "#457B9D",
        "description": "Execution-focused. Cuts through strategy to how you actually do this step by step. Practical and grounding."
    },
    "Visionary": {
        "color": "#7B2D8B",
        "description": "10x thinking. Sees the opportunity the PM is missing. Pushes beyond the immediate problem."
    },
    "User Advocate": {
        "color": "#2D6A4F",
        "description": "Always brings it back to the user. Asks what the user actually needs, not what the business wants."
    },
    "Data Oracle": {
        "color": "#E76F51",
        "description": "Evidence-first. Identifies what is being measured wrong, what metric actually matters, what the data is hiding."
    }
}

# --- Example Problems ---
EXAMPLE_PROBLEMS = [
    "Our DAU has been flat for 3 months and we can't find the cause",
    "I need to cut 3 features but my CEO is attached to all of them",
    "Should we go enterprise or double down on SMB?",
    "Engineering says my 6-week project will take 6 months"
]

# --- Guest Titles ---
GUEST_TITLES = {
    "Shreyas Doshi": "Product Leader and Coach",
    "Elena Verna": "Growth Advisor",
    "Ben Horowitz": "Co-founder, a16z",
    "Brian Chesky": "CEO, Airbnb",
    "Marty Cagan": "Partner, SVPG",
    "Gibson Biddle": "Former VP Product, Netflix",
    "Shishir Mehrotra": "CEO, Coda",
    "Ami Vora": "Chief Product Officer, Faire",
    "Deb Liu": "CEO, Ancestry",
    "Andrew Chen": "General Partner, a16z",
    "Casey Winters": "Chief Product Officer",
    "Lulu Cheng Meservey": "CCO, Substack",
    "Kevin Weil": "CPO, OpenAI",
    "Tomer London": "Co-founder, Gusto",
    "Lenny Rachitsky": "Lenny's Newsletter"
}

# --- Tier 1 Fallback Guests ---
FALLBACK_GUESTS = [
    "Brian Chesky", "Ben Horowitz", "Shreyas Doshi",
    "Elena Verna", "Shishir Mehrotra"
]

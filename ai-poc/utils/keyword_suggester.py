import re
from collections import Counter
from typing import Dict, List

# Lightweight, dependency-free keyword suggester
# Focused on FIR narratives: extract top tokens, sections, and simple context terms

STOPWORDS = set(
    "the a an and or to of for in on at from by with without is are was were be been being has have had do does did this that these those as it".split()
)

CONTEXT_HINTS = {
    "weapon": ["knife", "gun", "pistol", "blade", "bat", "rod", "stick", "machete"],
    "location": ["road", "street", "market", "apartment", "station", "temple", "mall", "school", "college", "bridge", "highway", "lane"],
    "time": ["night", "evening", "morning", "afternoon"],
}


def _tokenize(text: str) -> List[str]:
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    tokens = [t for t in text.split() if t and t not in STOPWORDS and len(t) > 2]
    return tokens


def _top_keywords(tokens: List[str], limit: int = 5) -> List[str]:
    counts = Counter(tokens)
    return [w for w, _ in counts.most_common(limit)]


def _extract_sections(text: str) -> List[str]:
    sections = re.findall(r"(ipc\s*\d+|bns\s*\d+)", text, flags=re.IGNORECASE)
    return list({s.upper().replace(" ", " ") for s in sections})


def _extract_context(tokens: List[str]) -> List[str]:
    found = []
    for category, words in CONTEXT_HINTS.items():
        for w in words:
            if w in tokens:
                found.append(f"{category}:{w}")
    return found


def suggest_keywords(text: str, max_items: int = 8) -> Dict:
    """Return suggested keywords, sections, and context chips."""
    if not text or len(text.strip()) < 10:
        return {"keywords": [], "sections": [], "context": []}

    tokens = _tokenize(text)
    keywords = _top_keywords(tokens, limit=max_items)
    sections = _extract_sections(text)
    context = _extract_context(tokens)

    # De-dupe and limit total suggestions
    keywords = keywords[: max_items]
    sections = sections[: max_items]
    context = context[: max_items]

    return {
        "keywords": keywords,
        "sections": sections,
        "context": context,
    }

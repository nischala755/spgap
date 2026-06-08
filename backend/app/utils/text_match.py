"""Lightweight text matching for natural-language domain interests."""

import re

STOP_WORDS = {
    "the", "and", "for", "with", "that", "this", "from", "have", "want",
    "like", "work", "using", "into", "about", "would", "interested", "interest",
    "project", "build", "develop", "learning", "learn", "also", "very", "really",
}


def tokenize(text: str) -> set[str]:
    if not text:
        return set()
    words = re.findall(r"[a-z0-9+/]+", text.lower())
    return {w for w in words if len(w) > 2 and w not in STOP_WORDS}


def text_similarity(text_a: str, text_b: str) -> float:
    """Return overlap ratio between two texts (0.0–1.0)."""
    tokens_a = tokenize(text_a)
    tokens_b = tokenize(text_b)
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    return len(intersection) / min(len(tokens_a), len(tokens_b))


def keyword_in_text(keyword: str, text: str) -> bool:
    """Check if a domain/skill keyword appears in free text."""
    if not keyword or not text:
        return False
    kw_tokens = tokenize(keyword)
    text_tokens = tokenize(text)
    if not kw_tokens:
        return False
    return bool(kw_tokens & text_tokens) or keyword.lower() in text.lower()

import re
from typing import Dict, Any

IPC_REGEX = re.compile(r"IPC\s*\d{1,4}", re.IGNORECASE)
DATE_REGEX = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
PHONE_REGEX = re.compile(r"\b\d{10,13}\b")


def _redact_names(text: str, names: list) -> str:
    redacted = text
    for name in sorted(set(names), key=len, reverse=True):
        if not name.strip():
            continue
        redacted = re.sub(re.escape(name), "[REDACTED]", redacted)
    return redacted


def extract_entities(text: str) -> Dict[str, Any]:
    """Extract simple entities (sections, dates, phones, names) and return
    a dict with entities and a redacted_text field."""
    entities = {
        "sections": IPC_REGEX.findall(text),
        "dates": DATE_REGEX.findall(text),
        "phones": PHONE_REGEX.findall(text),
        "names": [],
    }

    # Try to use spaCy if installed
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)
        names = [ent.text for ent in doc.ents if ent.label_ in ("PERSON", "ORG")]
        entities["names"] = names
    except Exception:
        # spaCy not available or model not installed; skip names
        entities["names"] = []

    # Create redacted text by replacing phones and names
    redacted = text
    for phone in entities["phones"]:
        redacted = redacted.replace(phone, "[REDACTED_PHONE]")

    redacted = _redact_names(redacted, entities.get("names", []))

    result = {
        "entities": entities,
        "redactedText": redacted,
        "confidence": 0.9,
    }
    return result


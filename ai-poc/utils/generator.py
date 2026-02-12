import os
from typing import Optional, Dict

HF_API_TOKEN = os.getenv("HUGGINGFACE_HUB_API_TOKEN")
DEFAULT_MODEL = os.getenv("MODEL_NAME", "google/flan-t5-small")


def _build_prompt(text: str) -> str:
    prompt = (
        "You are an assistant that drafts concise charge-sheet style documents from case facts. "
        "Produce sections with headings: Summary, Charges, Evidence, Next Steps. Keep it factual and concise.\n\nFACTS:\n" + text
    )
    return prompt


def _call_hf_api(prompt: str, model: str = DEFAULT_MODEL) -> Optional[str]:
    """Call HuggingFace Inference API if token is provided."""
    try:
        import requests
        if not HF_API_TOKEN:
            return None
        url = f"https://api-inference.huggingface.co/models/{model}"
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}", "Accept": "application/json"}
        payload = {"inputs": prompt, "parameters": {"max_new_tokens": 512, "temperature": 0.2}}
        resp = requests.post(url, json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        j = resp.json()
        # HF may return a list of dicts with 'generated_text'
        if isinstance(j, dict) and 'error' in j:
            return None
        if isinstance(j, list) and len(j) > 0:
            return j[0].get('generated_text') or j[0].get('result') or None
        if isinstance(j, dict) and 'generated_text' in j:
            return j['generated_text']
        return None
    except Exception:
        return None


def _call_local_transformer(prompt: str, model: str = DEFAULT_MODEL) -> Optional[str]:
    try:
        from transformers import pipeline
        pipe = pipeline('text2text-generation', model=model, truncation=True)
        out = pipe(prompt, max_length=512, do_sample=False)
        if isinstance(out, list) and len(out) > 0:
            return out[0].get('generated_text') or out[0].get('summary_text') or None
        return None
    except Exception:
        return None


def generate_draft_from_text(text: str, model: Optional[str] = None) -> Dict[str, Optional[str]]:
    """Generate a draft from text. Returns dict { draft, modelInfo, prompt }"""
    if not text:
        return {"draft": "", "modelInfo": None, "prompt": None}

    prompt = _build_prompt(text)
    model = model or DEFAULT_MODEL

    # Try HF API if token provided
    if HF_API_TOKEN:
        out = _call_hf_api(prompt, model=model)
        if out:
            return {"draft": out.strip(), "modelInfo": f"hf-api:{model}", "prompt": prompt}

    # Try local transformer
    out = _call_local_transformer(prompt, model=model)
    if out:
        return {"draft": out.strip(), "modelInfo": f"local:{model}", "prompt": prompt}

    # Fallback: simple extractive template
    summary = text.strip()[:1000]
    fallback = (
        "Summary:\n" + summary + "\n\nCharges:\n[Please fill]\n\nEvidence:\n[Please list key evidence]\n\nNext Steps:\n[Suggested next steps]"
    )
    return {"draft": fallback, "modelInfo": "fallback", "prompt": prompt}


def generate_answer_from_context(context: str, question: str, model: Optional[str] = None) -> Dict[str, Optional[str]]:
    """Generate an answer for a question given a context."""
    if not question:
        return {"answer": "Please ask a question.", "modelInfo": None}
    
    prompt = (
        f"You are a helpful legal assistant. Use the following context to answer the question faithfully. "
        f"If the answer is not in the context, say 'I don't have enough information'.\n\n"
        f"CONTEXT:\n{context}\n\n"
        f"QUESTION: {question}\n\n"
        f"ANSWER:"
    )
    
    model = model or DEFAULT_MODEL

    # Reuse existing generation logic
    # Try HF API if token provided
    if HF_API_TOKEN:
        out = _call_hf_api(prompt, model=model)
        if out:
            return {"answer": out.strip(), "modelInfo": f"hf-api:{model}", "prompt": prompt}

    # Try local transformer
    out = _call_local_transformer(prompt, model=model)
    if out:
        return {"answer": out.strip(), "modelInfo": f"local:{model}", "prompt": prompt}

    # Fallback
    return {"answer": "AI service offline or busy. Please try again.", "modelInfo": "fallback", "prompt": prompt}


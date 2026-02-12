from sentence_transformers import SentenceTransformer
import numpy as np

_MODEL_NAME = "all-MiniLM-L6-v2"
_model = None


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(_MODEL_NAME)
    return _model


def embed_texts(texts):
    """Return numpy array of shape (len(texts), dim) with float32 vectors (normalized)."""
    if not texts:
        return np.zeros((0, 384), dtype=np.float32)
    model = _get_model()
    embs = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embs.astype(np.float32)


def embed_text(text):
    embs = embed_texts([text])
    return embs[0] if len(embs) else None


import os
import json
import faiss
import numpy as np
from config import INDEX_PATH, STORAGE_DIR

# store meta alongside index
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
INDEX_FULL_PATH = os.path.join(BASE_DIR, INDEX_PATH)
META_DIR = os.path.join(BASE_DIR, "storage", "indexes")
META_PATH = os.path.join(META_DIR, "meta.json")

_index = None
_meta = None


def _ensure_dirs():
    os.makedirs(META_DIR, exist_ok=True)


def index_exists():
    return os.path.exists(INDEX_FULL_PATH) and os.path.exists(META_PATH)


def build_index(output_dir):
    """Scan extraction JSONs under output_dir and build a FAISS index. Returns number indexed."""
    _ensure_dirs()
    docs = []
    ids = []
    metadata = []

    # look for files directly under output_dir (exclude ai_documents subdir)
    for fn in os.listdir(output_dir):
        if not fn.endswith('.json'):
            continue
        path = os.path.join(output_dir, fn)
        if os.path.isdir(path):
            continue
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            # heuristic: extraction files have 'extractedText'
            if 'extractedText' in data:
                text = data.get('redactedText') or data.get('extractedText') or ''
                if not text.strip():
                    continue
                docs.append(text)
                ids.append(data.get('id'))
                metadata.append({
                    'id': data.get('id'),
                    'caseId': data.get('caseId'),
                    'sourceFile': data.get('sourceFile'),
                    'snippet': text[:400]
                })
        except Exception:
            continue

    if not docs:
        # nothing to index
        # write empty meta and remove old index if any
        if os.path.exists(INDEX_FULL_PATH):
            try:
                os.remove(INDEX_FULL_PATH)
            except Exception:
                pass
        with open(META_PATH, 'w', encoding='utf-8') as mf:
            json.dump({'items': []}, mf)
        return 0

    # compute embeddings lazily to avoid heavy startup
    from utils.embeddings import embed_texts
    vectors = embed_texts(docs)

    # ensure vectors are 2D
    if vectors.ndim == 1:
        vectors = vectors.reshape(1, -1)

    dim = vectors.shape[1]
    # use inner product on normalized vectors as cosine similarity
    index = faiss.IndexFlatIP(dim)
    index.add(vectors.astype(np.float32))

    # save index and meta
    faiss.write_index(index, INDEX_FULL_PATH)

    with open(META_PATH, 'w', encoding='utf-8') as mf:
        json.dump({'items': metadata}, mf, ensure_ascii=False, indent=2)

    # clear cached
    global _index, _meta
    _index = None
    _meta = None

    return len(docs)


def _load_index_and_meta():
    global _index, _meta
    if _index is not None and _meta is not None:
        return _index, _meta
    if not os.path.exists(INDEX_FULL_PATH) or not os.path.exists(META_PATH):
        raise FileNotFoundError('Index or meta not found. Run POST /index to build it.')
    idx = faiss.read_index(INDEX_FULL_PATH)
    with open(META_PATH, 'r', encoding='utf-8') as mf:
        meta = json.load(mf).get('items', [])
    _index = idx
    _meta = meta
    return _index, _meta


def search_index(query_text, k=5):
    """Search the index for query_text and return up to k results with scores and metadata."""
    try:
        idx, meta = _load_index_and_meta()
    except FileNotFoundError:
        # Graceful degradation: return empty results if index doesn't exist
        return []
    
    from utils.embeddings import embed_text
    qv = embed_text(query_text).astype(np.float32)
    if qv.ndim == 1:
        qv = qv.reshape(1, -1)
    D, I = idx.search(qv, k)
    results = []
    for score, iid in zip(D[0], I[0]):
        if iid < 0 or iid >= len(meta):
            continue
        m = meta[iid]
        results.append({
            'score': float(score),
            'id': m.get('id'),
            'caseId': m.get('caseId'),
            'sourceFile': m.get('sourceFile'),
            'snippet': m.get('snippet')
        })
    return results


from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os
import sys
import json
from datetime import datetime

# Ensure project root (ai-poc) is on sys.path so utils imports work when running via uvicorn
BASE_DIR = os.path.dirname(__file__)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from utils.ocr import image_to_text
from utils.ner import extract_entities

app = FastAPI(title="ai-poc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = os.path.dirname(__file__)
STORAGE_DIR = os.path.join(ROOT_DIR, "storage")
EXTRACTS_DIR = os.path.join(STORAGE_DIR, "extracts")
OUTPUT_ROOT = os.path.join(STORAGE_DIR, "output")
EXTRACTIONS_JSON_DIR = os.path.join(OUTPUT_ROOT, "ai_extractions")
AI_DOCUMENTS_DIR = os.path.join(OUTPUT_ROOT, "ai_documents")

os.makedirs(EXTRACTS_DIR, exist_ok=True)
os.makedirs(EXTRACTIONS_JSON_DIR, exist_ok=True)
os.makedirs(AI_DOCUMENTS_DIR, exist_ok=True)


@app.get("/health")
async def health_check():
    """Health check endpoint with service status"""
    import time
    health = {
        "success": True,
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "uptime": time.process_time(),
        "services": {
            "api": "up",
            "storage": "unknown",
            "models": "unknown"
        }
    }
    
    # Check storage directories
    try:
        if os.path.exists(EXTRACTS_DIR) and os.access(EXTRACTS_DIR, os.W_OK):
            health["services"]["storage"] = "up"
        else:
            health["services"]["storage"] = "down"
            health["status"] = "degraded"
    except Exception:
        health["services"]["storage"] = "down"
        health["status"] = "degraded"
    
    # Check if core utils are importable (models loaded)
    try:
        from utils.ocr import image_to_text
        from utils.ner import extract_entities
        health["services"]["models"] = "up"
    except Exception:
        health["services"]["models"] = "down"
        health["status"] = "degraded"
        health["success"] = False
    
    return JSONResponse(health, status_code=200 if health["success"] else 503)


@app.post("/ocr-extract")
async def ocr_extract(file: UploadFile = File(...), caseId: str = Form(None)):
    """Accepts a file, saves it, runs OCR + NER, redacts PII, and saves JSON output."""
    try:
        content = await file.read()
        file_id = str(uuid.uuid4())
        filename = f"{file_id}-{file.filename}"
        out_path = os.path.join(EXTRACTS_DIR, filename)

        with open(out_path, "wb") as f:
            f.write(content)

        # OCR
        text = image_to_text(content)

        # NER + redaction
        ner_result = extract_entities(text)

        extraction = {
            "id": file_id,
            "caseId": caseId,
            "sourceFile": filename,
            "extractedText": text,
            "redactedText": ner_result.get("redactedText", ""),
            "entities": ner_result.get("entities", {}),
            "confidence": ner_result.get("confidence", 0.0),
            "createdAt": datetime.utcnow().isoformat() + "Z",
        }

        out_json_path = os.path.join(EXTRACTIONS_JSON_DIR, f"{file_id}.json")
        with open(out_json_path, "w", encoding="utf-8") as jf:
            json.dump(extraction, jf, ensure_ascii=False, indent=2)

        return JSONResponse({"success": True, "data": {"extractionId": file_id, "entities": extraction["entities"]}})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/extractions/{extraction_id}")
async def get_extraction(extraction_id: str):
    path = os.path.join(EXTRACTIONS_JSON_DIR, f"{extraction_id}.json")
    if not os.path.exists(path):
        return JSONResponse({"success": False, "error": "Extraction not found"}, status_code=404)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return JSONResponse({"success": True, "data": data})


@app.post('/generate-draft')
async def generate_draft(text: str = Form(None), extractionId: str = Form(None), model: str = Form(None)):
    """Generate a draft given raw text or an existing extractionId. Saves draft JSON to output."""
    try:
        source_text = text
        case_id = None
        source_extraction_id = None
        if extractionId:
            path = os.path.join(EXTRACTIONS_JSON_DIR, f"{extractionId}.json")
            if not os.path.exists(path):
                return JSONResponse({"success": False, "error": "Extraction not found"}, status_code=404)
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            source_text = data.get('redactedText') or data.get('extractedText')
            case_id = data.get('caseId')
            source_extraction_id = extractionId

        if not source_text:
            return JSONResponse({"success": False, "error": "No input text or extraction provided"}, status_code=400)

        from utils.generator import generate_draft_from_text

        result = generate_draft_from_text(source_text, model)
        doc_id = str(uuid.uuid4())
        doc = {
            'id': doc_id,
            'caseId': case_id,
            'extractionId': source_extraction_id,
            'documentType': 'CHARGE_SHEET',
            'draftText': result.get('draft'),
            'status': 'DRAFT',
            'modelInfo': result.get('modelInfo'),
            'prompt': result.get('prompt'),
            'createdAt': datetime.utcnow().isoformat() + 'Z'
        }

        out_path = os.path.join(AI_DOCUMENTS_DIR, f"{doc_id}.json")
        with open(out_path, 'w', encoding='utf-8') as jf:
            json.dump(doc, jf, ensure_ascii=False, indent=2)

        return JSONResponse({"success": True, "data": {"documentId": doc_id, "draft": doc['draftText']}})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get('/drafts/{doc_id}')
async def get_draft(doc_id: str):
    path = os.path.join(AI_DOCUMENTS_DIR, f"{doc_id}.json")
    if not os.path.exists(path):
        return JSONResponse({"success": False, "error": "Draft not found"}, status_code=404)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return JSONResponse({"success": True, "data": data})


@app.post('/index')
async def rebuild_index():
    """Rebuild FAISS index from extraction JSONs in output dir."""
    try:
        # lazy import to avoid startup cost
        from utils.faiss_index import build_index
        n = build_index(EXTRACTIONS_JSON_DIR)
        return JSONResponse({"success": True, "indexed": n})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post('/index/doc/{extraction_id}')
async def index_single_document(extraction_id: str):
    """Index a single extraction document by id. For now, this triggers a full rebuild but is exposed for future incremental upserts."""
    try:
        # verify file exists
        path = os.path.join(EXTRACTIONS_JSON_DIR, f"{extraction_id}.json")
        if not os.path.exists(path):
            return JSONResponse({"success": False, "error": "Extraction not found"}, status_code=404)
        # For now reuse bulk builder (simple and reliable)
        from utils.faiss_index import build_index
        n = build_index(EXTRACTIONS_JSON_DIR)
        return JSONResponse({"success": True, "indexed": n, "indexedId": extraction_id})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get('/health')
async def health():
    """Health check endpoint for service availability monitoring"""
    return JSONResponse({"status": "healthy", "service": "ai-poc"})


@app.get('/search')
async def search(q: str = None, k: int = 5):
    """Search extractions for query text. Use GET /search?q=...&k=5"""
    if not q:
        return JSONResponse({"success": False, "error": "Query parameter 'q' is required"}, status_code=400)
    try:
        from utils.faiss_index import search_index, index_exists
        if not index_exists():
            return JSONResponse({"success": False, "error": "Index not found. POST /index to build it."}, status_code=404)
        res = search_index(q, k)
        return JSONResponse({"success": True, "data": res})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post('/chat')
async def chat(q: str = Form(...), k: int = Form(3), model: str = Form(None)):
    """RAG Chat: Search index and answer question."""
    try:
        if not q.strip():
             return JSONResponse({"success": False, "error": "Query required"}, status_code=400)

        # 0. Quick Greeting Check
        user_query = q.lower().strip()
        greetings = ["hi", "hello", "hey", "namaste", "hola"]
        if user_query in greetings:
            return JSONResponse({
                "success": True, 
                "answer": "Hello! I am your Legal Co-Pilot. I can answer questions based on the uploaded case documents. Try asking about a specific FIR or Evidence.", 
                "sources": []
            })

        # 1. Retrieve
        from utils.faiss_index import search_index, index_exists
        if not index_exists():
            return JSONResponse({"success": True, "answer": "The Knowledge Base is empty. Please upload/index some documents first.", "sources": []})
        
        results = search_index(q, k)
        
        # 2. Augment
        context_parts = []
        sources = []
        for res in results:
            text = res.get('text', '')
            meta = res.get('metadata', {})
            src = meta.get('sourceFile', 'unknown')
            score = res.get('score', 0)
            context_parts.append(f"Source ({src}): {text}")
            sources.append({"source": src, "score": score, "id": meta.get('id')})
        
        full_context = "\n\n".join(context_parts)
        
        # 3. Generate
        from utils.generator import generate_answer_from_context
        gen_res = generate_answer_from_context(full_context, q, model)
        
        return JSONResponse({
            "success": True, 
            "answer": gen_res.get('answer'), 
            "sources": sources,
            "debug": {"model": gen_res.get('modelInfo')}
        })

    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


# ============================================
# ENHANCED AI ENDPOINTS (Round 3 Advanced Features)
# ============================================

@app.post("/api/ai/multilingual-ocr")
async def enhanced_multilingual_ocr(file: UploadFile = File(...), language: str = Form(None), auto_detect: bool = Form(True)):
    """Multilingual OCR with 11+ language support"""
    try:
        from utils.multilingual_ocr import extract_text_multilingual
        content = await file.read()
        result = extract_text_multilingual(content, language, auto_detect)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/api/ai/legal-ner")
async def enhanced_legal_ner(text: str = Form(...)):
    """Enhanced Named Entity Recognition for legal texts"""
    try:
        from utils.legal_ner import extract_legal_entities
        result = extract_legal_entities(text)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/api/ai/suggest-sections")
async def enhanced_suggest_sections(case_description: str = Form(...), top_k: int = Form(5), code_type: str = Form('both')):
    """Suggest applicable IPC/BNS sections from case description"""
    try:
        from utils.section_suggester import suggest_sections
        result = suggest_sections(case_description, top_k, code_type)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/api/ai/find-precedents")
async def enhanced_find_precedents(query: str = Form(...), top_k: int = Form(5), section: str = Form(None)):
    """Find similar precedent cases using semantic search"""
    try:
        from utils.precedent_matcher import find_precedents
        result = find_precedents(query, top_k, section)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/api/ai/suggest-keywords")
async def enhanced_suggest_keywords(text: str = Form(...), max_items: int = Form(8)):
    """Extract and suggest keywords from text"""
    try:
        from utils.keyword_suggester import suggest_keywords
        result = suggest_keywords(text, max_items)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/api/ai/generate-document")
async def enhanced_generate_document(document_type: str = Form(...), case_data: str = Form(None)):
    """Generate legal documents from case data"""
    try:
        from utils.advanced_generator import generate_document
        import json
        case_data_obj = json.loads(case_data) if case_data else {}
        result = generate_document(document_type, case_data_obj)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/api/ai/advanced-search")
async def enhanced_advanced_search(query: str = Form(...), top_k: int = Form(5), use_reranking: bool = Form(False)):
    """Advanced search with optional cross-encoder reranking"""
    try:
        from utils.faiss_index import search_index
        from utils.reranker import rerank_results
        results = search_index(query, top_k)
        if use_reranking:
            results = rerank_results(query, results)
        return JSONResponse({"success": True, "data": {"results": results}})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/api/ai/case-readiness")
async def enhanced_case_readiness(caseId: str = Form(...), caseType: str = Form(...), 
                                  witness_count: int = Form(0), evidence_count: int = Form(0),
                                  days_elapsed: int = Form(0)):
    """Check case readiness for prosecution (SHO feature)"""
    try:
        from utils.case_analyzer import analyze_case_readiness
        result = analyze_case_readiness(caseId, caseType, witness_count, evidence_count, days_elapsed)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/api/ai/document-validate")
async def enhanced_document_validate(document_type: str = Form(...), document_name: str = Form(...)):
    """Validate document compliance (Clerk feature)"""
    try:
        from utils.document_validator import validate_document
        result = validate_document(document_type, document_name)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/api/ai/case-brief")
async def enhanced_case_brief(caseId: str = Form(...), caseNumber: str = Form(...), caseType: str = Form(...)):
    """Generate comprehensive case brief (Judge feature)"""
    try:
        from utils.brief_generator import generate_case_brief
        result = generate_case_brief(caseId, caseNumber, caseType)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/api/ai/stats")
async def enhanced_stats():
    """Get AI service statistics"""
    try:
        from utils.faiss_index import index_exists
        return JSONResponse({"success": True, "data": {
            "index_ready": index_exists(),
            "service": "ai-poc",
            "version": "1.0",
            "timestamp": datetime.utcnow().isoformat()
        }})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/api/ai/templates")
async def enhanced_templates():
    """Get available document templates"""
    return JSONResponse({"success": True, "data": {
        "templates": [
            {"name": "charge_sheet", "description": "Charge Sheet Template"},
            {"name": "evidence_list", "description": "Evidence List Template"},
            {"name": "witness_list", "description": "Witness List Template"}
        ]
    }})


@app.get("/api/ai/section-details/{section_id}")
async def enhanced_section_details(section_id: str, code_type: str = "ipc"):
    """Get detailed information about a legal section"""
    # Comprehensive section details database - synced with sections-list
    sections_db = {
        "ipc": {
            # Offences Against Life
            "302": {"title": "Murder", "description": "Whoever commits murder shall be punished with death or life imprisonment and shall also be liable to fine.", "punishment": "Death or life imprisonment, and fine", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
            "304": {"title": "Culpable Homicide Not Amounting to Murder", "description": "When a person is killed by any act which does not amount to culpable homicide punishable with death or life imprisonment.", "punishment": "Imprisonment up to 2 years, or fine up to 1000 rupees, or both", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
            "305": {"title": "Abetment of Suicide of Child or Person of Unsound Mind", "description": "Abetment of suicide of a child or person of unsound mind or intoxicated person.", "punishment": "Death or life imprisonment and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
            "306": {"title": "Abetment of Suicide", "description": "Whoever abets the commission of suicide by any person is guilty of abetment of suicide.", "punishment": "Imprisonment up to 10 years and fine up to 1000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
            "307": {"title": "Attempt to Murder", "description": "When an act is done with intent or knowledge that if it caused death that person would be guilty of murder.", "punishment": "Imprisonment up to 10 years and fine up to 1000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
            "308": {"title": "Attempt to Commit Culpable Homicide", "description": "Attempt to commit an act which, if by that act death were caused, would amount to culpable homicide but not to murder.", "punishment": "Imprisonment up to 3 years, or fine up to 500 rupees, or both", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
            # Offences Against Body
            "321": {"title": "Voluntarily Causing Hurt", "description": "Whoever does any act with the intention of thereby causing hurt to any person, or with the knowledge that he is likely thereby to cause hurt to any person.", "punishment": "Imprisonment up to 1 year or fine up to 1000 rupees or both", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
            "323": {"title": "Causing Hurt", "description": "Whoever, by doing any act, causes hurt to any person, intending to do so or knowing that he is likely thereby to cause hurt, shall be punished.", "punishment": "Imprisonment up to 3 months, or fine up to 250 rupees, or both", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
            "325": {"title": "Voluntarily Causing Grievous Hurt", "description": "Whoever, by doing any act, causes hurt to any person intending to cause grievous hurt, or knowing it to be likely that his act will cause grievous hurt.", "punishment": "Imprisonment up to 7 years and fine up to 1000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
            "326": {"title": "Causing Hurt by Poison, Fire, or Explosion", "description": "Whoever causes hurt to any person by administering poison, fire, or explosion, or by any other means.", "punishment": "Life imprisonment or up to 15 years imprisonment or fine", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
            "328": {"title": "Causing Hurt by Means of Poison", "description": "Whoever administers to or causes to be taken by any person any poison or any stupefying, intoxicating or unwholesome drug.", "punishment": "Imprisonment up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
            "330": {"title": "Voluntarily Causing Hurt to Extort Confession", "description": "Whoever voluntarily causes hurt for the purpose of extorting any confession or information.", "punishment": "Imprisonment up to 7 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
            # Offences Against Women
            "354": {"title": "Assault or Criminal Force to Woman with Intent to Outrage Modesty", "description": "Any man who assaults or uses criminal force to any woman, intending to outrage or knowing it likely to outrage her modesty.", "punishment": "Imprisonment up to 3 years or fine up to 2000 rupees or both", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
            "355": {"title": "Assault or Criminal Force with Intent to Dishonor Person", "description": "Whoever assaults or uses criminal force to any person, intending thereby to dishonor that person.", "punishment": "Imprisonment up to 2 years or fine or both", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
            "372": {"title": "Selling Minor for Purposes of Prostitution", "description": "Whoever sells, lets to hire, or otherwise disposes of any person under the age of eighteen years with intent that such person shall be employed or used for prostitution.", "punishment": "Imprisonment up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            "373": {"title": "Buying Minor for Purposes of Prostitution", "description": "Whoever buys, hires or otherwise obtains possession of any person under the age of eighteen years with intent that such person shall be employed or used for prostitution.", "punishment": "Imprisonment up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            "374": {"title": "Unlawful Compulsory Labour", "description": "Whoever unlawfully compels any person to labour against the will of that person.", "punishment": "Imprisonment up to 1 year or fine or both", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
            "375": {"title": "Rape - Definition", "description": "A man is said to commit rape if he has sexual intercourse with a woman under circumstances falling under any of the seven descriptions.", "punishment": "N/A - Definitional Section", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            "376": {"title": "Punishment for Rape", "description": "A man is said to commit rape if he has sexual intercourse with a woman against her will, without her consent, by putting her in fear or by fraud.", "punishment": "Rigorous imprisonment for a term which shall not be less than 10 years but may extend to life imprisonment, and shall also be liable to fine", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            # Offences Against Property
            "378": {"title": "Theft", "description": "Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property.", "punishment": "Imprisonment up to 3 years or fine or both", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
            "379": {"title": "Punishment for Theft", "description": "Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.", "punishment": "Imprisonment up to 3 years or fine or both", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
            "380": {"title": "Theft in Dwelling House", "description": "Whoever commits theft in any building, tent or vessel used as a human dwelling.", "punishment": "Imprisonment up to 7 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "381": {"title": "Theft by Clerk or Servant", "description": "Whoever, being a clerk or servant, commits theft in respect of any property in the possession of his master or employer.", "punishment": "Imprisonment up to 7 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "390": {"title": "Dacoity", "description": "When five or more persons commit or attempt to commit a robbery, it is designated dacoity.", "punishment": "Imprisonment up to 10 years and fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "392": {"title": "Punishment for Robbery", "description": "Whoever commits robbery shall be punished with rigorous imprisonment for a term which may extend to ten years, and shall also be liable to fine.", "punishment": "Rigorous imprisonment up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "406": {"title": "Criminal Breach of Trust", "description": "Whoever, being in any manner entrusted with property, dishonestly misappropriates or converts to his own use that property.", "punishment": "Imprisonment up to 3 years or fine or both", "bailable": True, "cognizable": False, "category": "Offences Against Property"},
            "409": {"title": "Criminal Breach of Trust by Public Servant", "description": "Whoever, being a public servant, or being a banker, merchant or agent, commits criminal breach of trust.", "punishment": "Imprisonment for life or up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "420": {"title": "Cheating and Dishonestly Inducing Delivery of Property", "description": "Whoever cheats and thereby dishonestly induces any person to deliver any property to any person.", "punishment": "Imprisonment up to 7 years and fine up to 1000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "425": {"title": "Mischief", "description": "Whoever with intent to cause, or knowing that he is likely to cause, wrongful loss or damage to the public or to any person.", "punishment": "Imprisonment up to 3 months or fine or both", "bailable": True, "cognizable": False, "category": "Offences Against Property"},
            "427": {"title": "Mischief Causing Damage", "description": "Whoever commits mischief and thereby causes loss or damage to the amount of fifty rupees or upwards.", "punishment": "Imprisonment up to 2 years or fine or both", "bailable": True, "cognizable": False, "category": "Offences Against Property"},
            "435": {"title": "Mischief by Fire or Explosive Substance", "description": "Whoever commits mischief by fire or any explosive substance intending to cause damage.", "punishment": "Imprisonment up to 7 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "450": {"title": "House-Trespass", "description": "Whoever commits house-trespass in order to the committing of any offence punishable with imprisonment.", "punishment": "Imprisonment up to 2 years and fine", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
            "456": {"title": "House-Trespass by Night", "description": "Whoever commits house-trespass, having made preparation for causing hurt to any person.", "punishment": "Imprisonment up to 5 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            # Offences Against Public Order
            "143": {"title": "Unlawful Assembly", "description": "An assembly of five or more persons is designated an unlawful assembly if the common object of the persons is unlawful.", "punishment": "Imprisonment up to 6 months or fine or both", "bailable": True, "cognizable": True, "category": "Offences Against Public Order"},
            "144": {"title": "Joining Unlawful Assembly Armed with Deadly Weapon", "description": "Whoever, being armed with any deadly weapon, joins any unlawful assembly.", "punishment": "Imprisonment up to 2 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Public Order"},
            "147": {"title": "Rioting", "description": "Whoever is guilty of rioting, shall be punished with imprisonment for a term which may extend to two years, or with fine, or with both.", "punishment": "Imprisonment up to 2 years or fine or both", "bailable": True, "cognizable": True, "category": "Offences Against Public Order"},
            "148": {"title": "Rioting, Armed with Deadly Weapon", "description": "Whoever is guilty of rioting, being armed with a deadly weapon or with anything which, used as a weapon of offence.", "punishment": "Imprisonment up to 3 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Public Order"},
            # Offences Against Religion
            "153": {"title": "Wantonly Giving Provocation with Intent to Cause Riot", "description": "Whoever malignantly, or wantonly, by doing anything which is illegal, gives provocation to any person intending or knowing it to be likely that such provocation will cause riot.", "punishment": "Imprisonment up to 1 year or fine or both", "bailable": True, "cognizable": True, "category": "Offences Against Religion"},
            "295": {"title": "Injuring or Defiling Place of Worship with Intent to Insult Religion", "description": "Whoever destroys, damages or defiles any place of worship, or any object held sacred by any class of persons.", "punishment": "Imprisonment up to 2 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Religion"},
            "298": {"title": "Uttering Words with Deliberate Intent to Wound Religious Feelings", "description": "Whoever, with the deliberate intention of wounding the religious feelings of any person, utters any word or makes any sound in the hearing of that person.", "punishment": "Imprisonment up to 1 year or fine or both", "bailable": True, "cognizable": False, "category": "Offences Against Religion"},
            # Elections
            "499": {"title": "Defamation", "description": "Whoever makes any imputation concerning any person intending to harm his reputation and knowing it to be false.", "punishment": "Simple imprisonment up to 2 years or fine up to 2500 rupees or both", "bailable": True, "cognizable": False, "category": "Offences Relating to Elections"},
            "500": {"title": "Punishment for Defamation", "description": "Whoever defames another shall be punished with simple imprisonment for a term which may extend to two years, or with fine, or with both.", "punishment": "Simple imprisonment up to 2 years or fine or both", "bailable": True, "cognizable": False, "category": "Offences Relating to Elections"},
            # Public Tranquility
            "504": {"title": "Intentional Insult with Intent to Provoke Breach of Peace", "description": "Whoever intentionally insults any person, knowing or having reason to believe that such insult will provoke him to commit a breach of peace.", "punishment": "Imprisonment up to 2 years or fine up to 1000 rupees or both", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
            "505": {"title": "Statements Conducing to Public Mischief", "description": "Whoever makes, publishes or circulates any statement, rumour or report with intent to cause fear or alarm.", "punishment": "Imprisonment up to 3 years or fine up to 500 rupees or both", "bailable": True, "cognizable": True, "category": "Public Tranquility"},
            "506": {"title": "Criminal Intimidation", "description": "Whoever commits the offence of criminal intimidation shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both.", "punishment": "Imprisonment up to 2 years or fine or both", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
            # General
            "511": {"title": "Punishment for Attempting to Commit Offences Punishable with Imprisonment", "description": "Whoever attempts to commit an offence punishable by this Code with imprisonment for life or imprisonment.", "punishment": "Imprisonment up to half of longest term or fine or both", "bailable": True, "cognizable": True, "category": "General"},
        },
        "bns": {
            # Offences Against Life
            "103": {"title": "Murder", "description": "Whoever commits murder shall be punished with death or life imprisonment and shall also be liable to fine.", "punishment": "Death or life imprisonment, and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
            "104": {"title": "Culpable Homicide Not Amounting to Murder", "description": "When death is caused by any act which does not amount to culpable homicide punishable with death or life imprisonment.", "punishment": "Imprisonment up to 2 years and fine up to 10,000 rupees", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
            "105": {"title": "Attempt to Murder", "description": "When an act is done with intent or knowledge that if it caused death, the person would be guilty of murder.", "punishment": "Imprisonment up to 10 years and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
            "106": {"title": "Attempt to Commit Culpable Homicide", "description": "Attempt to commit an act which, if death resulted, would amount to culpable homicide but not to murder.", "punishment": "Imprisonment up to 3 years and fine up to 5,000 rupees", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
            "108": {"title": "Abetment of Suicide", "description": "Whoever abets the commission of suicide by any person is guilty of abetment of suicide.", "punishment": "Imprisonment up to 10 years and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
            # Offences Against Body
            "115": {"title": "Voluntarily Causing Hurt", "description": "Whoever does any act with the intention of thereby causing hurt to any person, or with the knowledge that he is likely thereby to cause hurt to any person.", "punishment": "Imprisonment up to 1 year or fine up to 5,000 rupees or both", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
            "118": {"title": "Causing Hurt", "description": "Whoever, by doing any act, causes hurt to any person, intending to do so or knowing it likely to cause hurt.", "punishment": "Imprisonment up to 3 months or fine up to 2,500 rupees or both", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
            "119": {"title": "Voluntarily Causing Grievous Hurt in Committing Robbery", "description": "Whoever voluntarily causes grievous hurt in the course of committing or attempting to commit robbery.", "punishment": "Imprisonment for life or rigorous imprisonment up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
            "120": {"title": "Voluntarily Causing Grievous Hurt", "description": "Whoever, by any act, causes hurt to any person intending to cause grievous hurt or knowing it likely to cause grievous hurt.", "punishment": "Imprisonment up to 7 years and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
            "121": {"title": "Causing Hurt by Poison, Fire, or Explosion", "description": "Whoever causes hurt to any person by administering poison, fire, or explosion, or by any other means.", "punishment": "Life imprisonment or up to 15 years imprisonment and fine", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
            "123": {"title": "Causing Hurt by Means of Poison", "description": "Whoever administers to or causes to be taken by any person any poison or any stupefying, intoxicating or unwholesome drug.", "punishment": "Imprisonment up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
            # Offences Against Women
            "61": {"title": "Wrongful Restraint", "description": "Whoever wrongfully restrains any person in such a manner as to prevent that person from proceeding beyond certain circumscribing limits.", "punishment": "Simple imprisonment up to 1 month or fine up to 5,000 rupees or both", "bailable": True, "cognizable": False, "category": "Offences Against Women"},
            "62": {"title": "Assault or Criminal Force to Woman with Intent to Outrage Modesty", "description": "Any man who assaults or uses criminal force to any woman, intending to outrage or knowing it likely to outrage her modesty.", "punishment": "Imprisonment up to 3 years or fine up to 3000 rupees or both", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
            "63": {"title": "Assault or Criminal Force with Intent to Dishonor Person", "description": "Whoever assaults or uses criminal force to any person, intending thereby to dishonor that person.", "punishment": "Imprisonment up to 2 years or fine up to 3,000 rupees or both", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
            "64": {"title": "Kidnapping or Abducting in Order to Murder", "description": "Whoever kidnaps or abducts any person in order that such person may be murdered or may be so disposed of as to be put in danger of being murdered.", "punishment": "Imprisonment for life or rigorous imprisonment up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            "66": {"title": "Kidnapping to Murder or for Ransom", "description": "Whoever kidnaps or abducts any person or keeps a person in detention after such kidnapping or abduction, and threatens to cause death or hurt to such person.", "punishment": "Death or imprisonment for life and fine", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            "67": {"title": "Wrongful Confinement for Ransom", "description": "Whoever kidnaps or abducts any person in order that such person may be subject to wrongful confinement, and whoever so confines any person for ransom.", "punishment": "Imprisonment up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            "68": {"title": "Rape - Definition", "description": "A man is said to commit rape if he has sexual intercourse with a woman under circumstances falling under any of the seven descriptions.", "punishment": "N/A - Definitional Section", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            "69": {"title": "Punishment for Rape", "description": "A man is said to commit rape if he has sexual intercourse with a woman against her will, without her consent, by putting her in fear or by fraud.", "punishment": "Rigorous imprisonment for a term not less than 10 years but may extend to life imprisonment, and fine not less than 5,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            "70": {"title": "Sexual Assault", "description": "Whoever assaults or uses criminal force to any woman, intending to outrage or knowing it likely to outrage her modesty.", "punishment": "Imprisonment up to 5 years and fine up to 5,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
            # Offences Against Persons
            "77": {"title": "Unnatural Offence", "description": "Whoever voluntarily has carnal intercourse in violation of the order of nature, shall be punished.", "punishment": "Life imprisonment or imprisonment up to 10 years and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Persons"},
            # Offences Against Property
            "299": {"title": "Theft", "description": "Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property.", "punishment": "Imprisonment up to 3 years and fine up to 10,000 rupees", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
            "303": {"title": "Theft by Clerk or Servant", "description": "Whoever, being a clerk or servant, commits theft in respect of any property in the possession of his master or employer.", "punishment": "Imprisonment up to 7 years and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "304": {"title": "Theft in Dwelling House", "description": "Whoever commits theft in any building, tent or vessel used as a human dwelling.", "punishment": "Imprisonment up to 7 years and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "308": {"title": "Dacoity", "description": "When five or more persons commit or attempt to commit a robbery, it is designated dacoity.", "punishment": "Imprisonment up to 10 years and fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "312": {"title": "Punishment for Dacoity", "description": "Whoever commits dacoity shall be punished with imprisonment for life, or with rigorous imprisonment for a term which may extend to fourteen years, and shall also be liable to fine.", "punishment": "Life imprisonment or rigorous imprisonment up to 14 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "316": {"title": "Criminal Breach of Trust", "description": "Whoever, being in any manner entrusted with property, dishonestly misappropriates or converts to his own use that property.", "punishment": "Imprisonment up to 5 years or fine or both", "bailable": True, "cognizable": False, "category": "Offences Against Property"},
            "318": {"title": "Cheating and Dishonestly Inducing Delivery of Property", "description": "Whoever cheats and thereby dishonestly induces any person to deliver any property to any person.", "punishment": "Imprisonment up to 7 years and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            "320": {"title": "Mischief", "description": "Whoever with intent to cause, or knowing that he is likely to cause, wrongful loss or damage to the public or to any person.", "punishment": "Imprisonment up to 3 months or fine up to 5,000 rupees or both", "bailable": True, "cognizable": False, "category": "Offences Against Property"},
            "331": {"title": "House-Trespass", "description": "Whoever commits house-trespass in order to the committing of any offence punishable with imprisonment.", "punishment": "Imprisonment up to 2 years and fine up to 5,000 rupees", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
            "337": {"title": "House-Trespass by Night After Sunset", "description": "Whoever commits house-trespass, having made preparation for causing hurt to any person, or for assault or wrongful restraint.", "punishment": "Imprisonment up to 5 years and fine up to 10,000 rupees", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
            # Offences Against Public Order
            "141": {"title": "Unlawful Assembly", "description": "An assembly of five or more persons is designated an unlawful assembly if the common object of the persons is unlawful.", "punishment": "Imprisonment up to 6 months or fine up to 10,000 rupees or both", "bailable": True, "cognizable": True, "category": "Offences Against Public Order"},
            "142": {"title": "Being Member of Unlawful Assembly", "description": "Whoever, being aware of facts which render any assembly an unlawful assembly, intentionally joins that assembly, or continues in it.", "punishment": "Imprisonment up to 6 months or fine up to 10,000 rupees or both", "bailable": True, "cognizable": True, "category": "Offences Against Public Order"},
            "144": {"title": "Rioting", "description": "Whoever is guilty of rioting, shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both.", "punishment": "Imprisonment up to 2 years or fine up to 10,000 rupees or both", "bailable": True, "cognizable": True, "category": "Offences Against Public Order"},
            # Elections
            "152": {"title": "Defamation", "description": "Whoever makes any imputation concerning any person intending to harm his reputation and knowing it to be false.", "punishment": "Simple imprisonment up to 2 years or fine up to 5,000 rupees or both", "bailable": True, "cognizable": False, "category": "Offences Relating to Elections"},
            "153": {"title": "Printing or Engraving Matter Known to be Defamatory", "description": "Whoever prints or engraves any matter, knowing or having good reason to believe that such matter is defamatory of any person.", "punishment": "Simple imprisonment up to 2 years or fine or both", "bailable": True, "cognizable": False, "category": "Offences Relating to Elections"},
            # Public Tranquility
            "192": {"title": "Intentional Insult with Intent to Provoke Breach of Peace", "description": "Whoever intentionally insults any person, knowing that such insult will provoke him to commit a breach of peace.", "punishment": "Imprisonment up to 2 years or fine up to 5,000 rupees or both", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
            "196": {"title": "Statements Conducing to Public Mischief", "description": "Whoever makes, publishes or circulates any statement, rumour or report with intent to cause fear or alarm.", "punishment": "Imprisonment up to 3 years or fine up to 5,000 rupees or both", "bailable": True, "cognizable": True, "category": "Public Tranquility"},
            "197": {"title": "Criminal Intimidation", "description": "Whoever commits the offence of criminal intimidation shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both.", "punishment": "Imprisonment up to 2 years or fine up to 5,000 rupees or both", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
        }
    }
    
    try:
        if code_type.lower() in sections_db and section_id in sections_db[code_type.lower()]:
            details = sections_db[code_type.lower()][section_id]
            details["section"] = f"{code_type.upper()} {section_id}"
            details["number"] = section_id
            details["code"] = code_type.lower()
            return JSONResponse({"success": True, "data": details})
        else:
            return JSONResponse({"success": False, "error": f"Section {section_id} not found in {code_type.upper()}", "data": None}, status_code=404)
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/api/ai/precedents/section/{section}")
async def enhanced_precedents_by_section(section: str, top_k: int = 10):
    """Get precedents for a specific section"""
    try:
        from utils.precedent_matcher import get_precedents_for_section
        result = get_precedents_for_section(section, top_k)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/api/ai/sections-list")
async def enhanced_sections_list(code_type: str = "both"):
    """Get list of all available sections (IPC/BNS) - 50+ comprehensive legal sections"""
    ipc_sections = [
        # Offences Against Life
        {"value": "302", "label": "IPC 302 - Murder", "section": "IPC 302", "title": "Murder", "code": "ipc", "punishment": "Death or life imprisonment", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "304", "label": "IPC 304 - Culpable Homicide", "section": "IPC 304", "title": "Culpable Homicide Not Amounting to Murder", "code": "ipc", "punishment": "Up to 2 years imprisonment or fine", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
        {"value": "305", "label": "IPC 305 - Abetment of Suicide", "section": "IPC 305", "title": "Abetment of Suicide", "code": "ipc", "punishment": "Up to 10 years imprisonment or fine", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "306", "label": "IPC 306 - Abetment of Suicide", "section": "IPC 306", "title": "Abetment of Suicide by Person Under 18", "code": "ipc", "punishment": "Up to 10 years imprisonment or fine", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "307", "label": "IPC 307 - Attempt to Murder", "section": "IPC 307", "title": "Attempt to Murder", "code": "ipc", "punishment": "Up to 10 years imprisonment or fine", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "308", "label": "IPC 308 - Attempt Culpable Homicide", "section": "IPC 308", "title": "Attempt to Commit Culpable Homicide", "code": "ipc", "punishment": "Up to 3 years imprisonment or fine", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
        # Offences Against Body
        {"value": "321", "label": "IPC 321 - Causing Hurt", "section": "IPC 321", "title": "Causing Hurt", "code": "ipc", "punishment": "Up to 3 months or fine up to 500", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
        {"value": "323", "label": "IPC 323 - Causing Hurt", "section": "IPC 323", "title": "Causing Hurt", "code": "ipc", "punishment": "Up to 3 months or fine up to 250", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
        {"value": "325", "label": "IPC 325 - Grievous Hurt", "section": "IPC 325", "title": "Voluntarily Causing Grievous Hurt", "code": "ipc", "punishment": "Up to 7 years or fine up to 1000", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
        {"value": "326", "label": "IPC 326 - Hurt by Poison", "section": "IPC 326", "title": "Causing Hurt by Poison, Fire, or Explosion", "code": "ipc", "punishment": "Life imprisonment or up to 15 years", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
        {"value": "328", "label": "IPC 328 - Hurt by Means of Poison", "section": "IPC 328", "title": "Causing Hurt by Means of Poison", "code": "ipc", "punishment": "Up to 6 months or fine up to 500", "bailable": True, "cognizable": True, "category": "Offences Against Body"},
        {"value": "330", "label": "IPC 330 - Wrongful Restraint", "section": "IPC 330", "title": "Wrongful Restraint", "code": "ipc", "punishment": "Up to 1 month or fine up to 250", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
        # Offences Against Women
        {"value": "354", "label": "IPC 354 - Assault on Woman", "section": "IPC 354", "title": "Assault or Criminal Force to Woman", "code": "ipc", "punishment": "Up to 3 years or fine up to 2000", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
        {"value": "355", "label": "IPC 355 - Assault with Intent", "section": "IPC 355", "title": "Assault or Criminal Force with Intent to Dishonor", "code": "ipc", "punishment": "Up to 2 years or fine up to 1000", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
        {"value": "372", "label": "IPC 372 - Selling Minor", "section": "IPC 372", "title": "Selling or Buying Minors for Purposes of Prostitution", "code": "ipc", "punishment": "Up to 10 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "373", "label": "IPC 373 - Kidnapping", "section": "IPC 373", "title": "Kidnapping to Murder or Enslaving", "code": "ipc", "punishment": "Death or life imprisonment", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "374", "label": "IPC 374 - Wrongful Confinement", "section": "IPC 374", "title": "Wrongful Confinement for Ransom", "code": "ipc", "punishment": "Up to 10 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "376", "label": "IPC 376 - Rape", "section": "IPC 376", "title": "Rape", "code": "ipc", "punishment": "Up to 10 years or life imprisonment", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "375", "label": "IPC 375 - Definition of Rape", "section": "IPC 375", "title": "Definition of Rape", "code": "ipc", "punishment": "N/A - Definitional Section", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
        # Offences Against Property
        {"value": "378", "label": "IPC 378 - Theft", "section": "IPC 378", "title": "Theft", "code": "ipc", "punishment": "Up to 3 years or fine up to 500", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "379", "label": "IPC 379 - Theft by Finding", "section": "IPC 379", "title": "Theft by Clerk or Servant", "code": "ipc", "punishment": "Up to 3 years or fine up to 1000", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "380", "label": "IPC 380 - Theft", "section": "IPC 380", "title": "Theft in Dwelling House", "code": "ipc", "punishment": "Up to 3 years or fine up to 500", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "381", "label": "IPC 381 - Theft by Public Servant", "section": "IPC 381", "title": "Theft by Public Servant", "code": "ipc", "punishment": "Up to 5 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "390", "label": "IPC 390 - Dacoity", "section": "IPC 390", "title": "Dacoity", "code": "ipc", "punishment": "Up to 10 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "392", "label": "IPC 392 - Punishment for Dacoity", "section": "IPC 392", "title": "Punishment for Dacoity", "code": "ipc", "punishment": "Up to 10 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "406", "label": "IPC 406 - Criminal Breach of Trust", "section": "IPC 406", "title": "Criminal Breach of Trust", "code": "ipc", "punishment": "Up to 7 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "409", "label": "IPC 409 - Breach of Trust by Public Servant", "section": "IPC 409", "title": "Criminal Breach of Trust by Public Servant", "code": "ipc", "punishment": "Up to 10 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "420", "label": "IPC 420 - Cheating", "section": "IPC 420", "title": "Cheating and Dishonestly Inducing Delivery", "code": "ipc", "punishment": "Up to 7 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "425", "label": "IPC 425 - Mischief", "section": "IPC 425", "title": "Mischief", "code": "ipc", "punishment": "Up to 3 months or fine up to 250", "bailable": True, "cognizable": False, "category": "Offences Against Property"},
        {"value": "427", "label": "IPC 427 - Mischief Causing Damage", "section": "IPC 427", "title": "Mischief Causing Damage Over 50 Rupees", "code": "ipc", "punishment": "Up to 6 months or fine up to 1000", "bailable": True, "cognizable": False, "category": "Offences Against Property"},
        {"value": "435", "label": "IPC 435 - Arson", "section": "IPC 435", "title": "Mischief by Fire or Explosive Substance", "code": "ipc", "punishment": "Up to 6 months or fine up to 500", "bailable": True, "cognizable": False, "category": "Offences Against Property"},
        {"value": "450", "label": "IPC 450 - House-Trespass", "section": "IPC 450", "title": "House-Trespass", "code": "ipc", "punishment": "Up to 3 months or fine up to 250", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "456", "label": "IPC 456 - House-Trespass by Night", "section": "IPC 456", "title": "House-Trespass by Night After Sunset", "code": "ipc", "punishment": "Up to 5 years or fine up to 1000", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        # Offences Against Public Order
        {"value": "143", "label": "IPC 143 - Unlawful Assembly", "section": "IPC 143", "title": "Unlawful Assembly", "code": "ipc", "punishment": "Up to 6 months or fine up to 250", "bailable": True, "cognizable": True, "category": "Offences Against Public Order"},
        {"value": "144", "label": "IPC 144 - Armed Unlawful Assembly", "section": "IPC 144", "title": "Armed Unlawful Assembly", "code": "ipc", "punishment": "Up to 2 years or fine up to 1000", "bailable": False, "cognizable": True, "category": "Offences Against Public Order"},
        {"value": "147", "label": "IPC 147 - Rioting", "section": "IPC 147", "title": "Rioting", "code": "ipc", "punishment": "Up to 1 year or fine up to 500", "bailable": True, "cognizable": True, "category": "Offences Against Public Order"},
        {"value": "148", "label": "IPC 148 - Rioting Armed", "section": "IPC 148", "title": "Rioting Armed with Deadly Weapon", "code": "ipc", "punishment": "Up to 2 years or fine up to 1000", "bailable": False, "cognizable": True, "category": "Offences Against Public Order"},
        # Offences Against Religion
        {"value": "153", "label": "IPC 153 - Communal Disharmony", "section": "IPC 153", "title": "Wantonly Provoking or Insulting", "code": "ipc", "punishment": "Up to 1 year or fine up to 1000", "bailable": True, "cognizable": True, "category": "Offences Against Religion"},
        {"value": "295", "label": "IPC 295 - Insulting Religion", "section": "IPC 295", "title": "Insulting Religion of Any Class", "code": "ipc", "punishment": "Up to 3 years or fine up to 500", "bailable": False, "cognizable": True, "category": "Offences Against Religion"},
        {"value": "298", "label": "IPC 298 - Utterance of Words", "section": "IPC 298", "title": "Utterance of Words with Deliberate Intent", "code": "ipc", "punishment": "Up to 1 year or fine up to 500", "bailable": True, "cognizable": False, "category": "Offences Against Religion"},
        # Election Offences
        {"value": "499", "label": "IPC 499 - Defamation", "section": "IPC 499", "title": "Defamation", "code": "ipc", "punishment": "Up to 2 years or fine up to 2500", "bailable": True, "cognizable": False, "category": "Elections"},
        {"value": "500", "label": "IPC 500 - Defamation Punishment", "section": "IPC 500", "title": "Punishment for Defamation", "code": "ipc", "punishment": "Up to 2 years or fine up to 2500", "bailable": True, "cognizable": False, "category": "Elections"},
        # Public Tranquility
        {"value": "504", "label": "IPC 504 - Intentional Insult", "section": "IPC 504", "title": "Intentional Insult with Intent to Provoke Breach", "code": "ipc", "punishment": "Up to 2 years or fine up to 1000", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
        {"value": "505", "label": "IPC 505 - Public Mischief", "section": "IPC 505", "title": "Statements Conducing to Public Mischief", "code": "ipc", "punishment": "Up to 3 years or fine up to 500", "bailable": True, "cognizable": True, "category": "Public Tranquility"},
        {"value": "506", "label": "IPC 506 - Criminal Intimidation", "section": "IPC 506", "title": "Criminal Intimidation", "code": "ipc", "punishment": "Up to 2 years or fine up to 1000", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
        # Attempt and Abetment
        {"value": "511", "label": "IPC 511 - Attempt", "section": "IPC 511", "title": "Punishment for Attempting to Commit Offences", "code": "ipc", "punishment": "Varies by substantive offence", "bailable": True, "cognizable": True, "category": "General"},
    ]
    
    bns_sections = [
        # Offences Against Life
        {"value": "103", "label": "BNS 103 - Murder", "section": "BNS 103", "title": "Murder", "code": "bns", "punishment": "Death or life imprisonment and fine", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "104", "label": "BNS 104 - Culpable Homicide", "section": "BNS 104", "title": "Culpable Homicide Not Amounting to Murder", "code": "bns", "punishment": "Up to 2 years and fine up to 10000", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
        {"value": "105", "label": "BNS 105 - Attempt to Murder", "section": "BNS 105", "title": "Attempt to Murder", "code": "bns", "punishment": "Up to 10 years and fine up to 10000", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "106", "label": "BNS 106 - Attempt Culpable Homicide", "section": "BNS 106", "title": "Attempt to Commit Culpable Homicide", "code": "bns", "punishment": "Up to 3 years and fine up to 5000", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
        {"value": "108", "label": "BNS 108 - Abetment of Suicide", "section": "BNS 108", "title": "Abetment of Suicide", "code": "bns", "punishment": "Up to 10 years and fine up to 10000", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        # Offences Against Body
        {"value": "115", "label": "BNS 115 - Causing Hurt", "section": "BNS 115", "title": "Causing Hurt", "code": "bns", "punishment": "Up to 3 months or fine up to 5000 or both", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
        {"value": "118", "label": "BNS 118 - Causing Hurt", "section": "BNS 118", "title": "Causing Hurt", "code": "bns", "punishment": "Up to 3 months or fine up to 2500 or both", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
        {"value": "119", "label": "BNS 119 - Voluntarily Causing Grievous Hurt", "section": "BNS 119", "title": "Voluntarily Causing Grievous Hurt in Committing Robbery", "code": "bns", "punishment": "Up to 10 years and fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
        {"value": "120", "label": "BNS 120 - Grievous Hurt", "section": "BNS 120", "title": "Voluntarily Causing Grievous Hurt", "code": "bns", "punishment": "Up to 7 years and fine up to 10000", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
        {"value": "121", "label": "BNS 121 - Hurt by Poison", "section": "BNS 121", "title": "Causing Hurt by Poison, Fire, or Explosion", "code": "bns", "punishment": "Life or up to 15 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
        {"value": "123", "label": "BNS 123 - Hurt by Means of Poison", "section": "BNS 123", "title": "Causing Hurt by Means of Poison", "code": "bns", "punishment": "Up to 6 months or fine up to 5000 or both", "bailable": True, "cognizable": True, "category": "Offences Against Body"},
        # Offences Against Women
        {"value": "61", "label": "BNS 61 - Wrongful Restraint", "section": "BNS 61", "title": "Wrongful Restraint", "code": "bns", "punishment": "Up to 1 month or fine up to 5000 or both", "bailable": True, "cognizable": False, "category": "Offences Against Women"},
        {"value": "62", "label": "BNS 62 - Assault on Woman", "section": "BNS 62", "title": "Assault or Criminal Force to Woman", "code": "bns", "punishment": "Up to 3 years or fine up to 3000 or both", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
        {"value": "63", "label": "BNS 63 - Assault with Intent", "section": "BNS 63", "title": "Assault or Criminal Force with Intent to Dishonor", "code": "bns", "punishment": "Up to 2 years or fine up to 3000 or both", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
        {"value": "64", "label": "BNS 64 - Kidnapping", "section": "BNS 64", "title": "Kidnapping or Abducting Woman", "code": "bns", "punishment": "Up to 10 years and fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "66", "label": "BNS 66 - Kidnapping", "section": "BNS 66", "title": "Kidnapping to Murder or Enslaving", "code": "bns", "punishment": "Death or life imprisonment or up to 10 years", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "67", "label": "BNS 67 - Wrongful Confinement", "section": "BNS 67", "title": "Wrongful Confinement for Ransom", "code": "bns", "punishment": "Up to 10 years and fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "68", "label": "BNS 68 - Definition of Rape", "section": "BNS 68", "title": "Definition of Rape", "code": "bns", "punishment": "N/A - Definitional Section", "bailable": True, "cognizable": True, "category": "Offences Against Women"},
        {"value": "69", "label": "BNS 69 - Rape", "section": "BNS 69", "title": "Rape", "code": "bns", "punishment": "Up to 10 years or life imprisonment or death", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "70", "label": "BNS 70 - Sexual Assault", "section": "BNS 70", "title": "Sexual Assault", "code": "bns", "punishment": "Up to 5 years and fine up to 5000", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        # Offences Against Persons
        {"value": "77", "label": "BNS 77 - Unnatural Offence", "section": "BNS 77", "title": "Unnatural Offence", "code": "bns", "punishment": "Life or up to 10 years and fine", "bailable": False, "cognizable": True, "category": "Offences Against Persons"},
        # Offences Against Property
        {"value": "299", "label": "BNS 299 - Theft", "section": "BNS 299", "title": "Theft", "code": "bns", "punishment": "Up to 3 years and fine up to 10000", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "303", "label": "BNS 303 - Theft", "section": "BNS 303", "title": "Theft by Clerk or Servant", "code": "bns", "punishment": "Up to 3 years and fine up to 10000", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "304", "label": "BNS 304 - Theft", "section": "BNS 304", "title": "Theft in Dwelling House", "code": "bns", "punishment": "Up to 3 years and fine up to 10000", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "308", "label": "BNS 308 - Dacoity", "section": "BNS 308", "title": "Dacoity", "code": "bns", "punishment": "Up to 10 years and fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "312", "label": "BNS 312 - Dacoity Punishment", "section": "BNS 312", "title": "Punishment for Dacoity", "code": "bns", "punishment": "Up to 14 years and fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "316", "label": "BNS 316 - Breach of Trust", "section": "BNS 316", "title": "Criminal Breach of Trust", "code": "bns", "punishment": "Up to 8 years and fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "318", "label": "BNS 318 - Cheating", "section": "BNS 318", "title": "Cheating and Dishonestly Inducing Delivery", "code": "bns", "punishment": "Up to 7 years and fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "320", "label": "BNS 320 - Mischief", "section": "BNS 320", "title": "Mischief", "code": "bns", "punishment": "Up to 3 months or fine up to 5000 or both", "bailable": True, "cognizable": False, "category": "Offences Against Property"},
        {"value": "331", "label": "BNS 331 - House-Trespass", "section": "BNS 331", "title": "House-Trespass", "code": "bns", "punishment": "Up to 3 months or fine up to 5000 or both", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "337", "label": "BNS 337 - House-Trespass by Night", "section": "BNS 337", "title": "House-Trespass by Night After Sunset", "code": "bns", "punishment": "Up to 5 years and fine up to 10000 or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        # Offences Against Public Order
        {"value": "141", "label": "BNS 141 - Unlawful Assembly", "section": "BNS 141", "title": "Unlawful Assembly", "code": "bns", "punishment": "Up to 6 months or fine up to 10000 or both", "bailable": True, "cognizable": True, "category": "Offences Against Public Order"},
        {"value": "142", "label": "BNS 142 - Armed Unlawful Assembly", "section": "BNS 142", "title": "Armed Unlawful Assembly", "code": "bns", "punishment": "Up to 2 years and fine up to 10000 or both", "bailable": False, "cognizable": True, "category": "Offences Against Public Order"},
        {"value": "144", "label": "BNS 144 - Rioting", "section": "BNS 144", "title": "Rioting", "code": "bns", "punishment": "Up to 1 year and fine up to 10000 or both", "bailable": True, "cognizable": True, "category": "Offences Against Public Order"},
        # Elections
        {"value": "152", "label": "BNS 152 - Defamation", "section": "BNS 152", "title": "Defamation", "code": "bns", "punishment": "Up to 2 years or fine up to 5000 or both", "bailable": True, "cognizable": False, "category": "Elections"},
        {"value": "153", "label": "BNS 153 - Serious Defamation", "section": "BNS 153", "title": "Serious Defamation", "code": "bns", "punishment": "Up to 3 years and fine or both", "bailable": False, "cognizable": True, "category": "Elections"},
        # Public Tranquility
        {"value": "192", "label": "BNS 192 - Intentional Insult", "section": "BNS 192", "title": "Intentional Insult with Intent to Provoke Breach", "code": "bns", "punishment": "Up to 2 years or fine up to 5000 or both", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
        {"value": "196", "label": "BNS 196 - Public Mischief", "section": "BNS 196", "title": "Statements Conducing to Public Mischief", "code": "bns", "punishment": "Up to 3 years or fine up to 5000 or both", "bailable": True, "cognizable": True, "category": "Public Tranquility"},
        {"value": "197", "label": "BNS 197 - Criminal Intimidation", "section": "BNS 197", "title": "Criminal Intimidation", "code": "bns", "punishment": "Up to 2 years and fine up to 5000 or both", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
    ]
    
    if code_type.lower() == 'ipc':
        sections = ipc_sections
    elif code_type.lower() == 'bns':
        sections = bns_sections
    else:
        sections = ipc_sections + bns_sections
    
    return JSONResponse({"success": True, "data": {"sections": sections}})


@app.get("/api/ai/sections-list")
async def enhanced_sections_list(code_type: str = "both"):
    """Get list of all available sections (IPC/BNS)"""
    ipc_sections = [
        {"value": "302", "label": "IPC 302 - Murder", "section": "IPC 302", "title": "Murder", "code": "ipc", "punishment": "Life imprisonment or death", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "304", "label": "IPC 304 - Culpable Homicide", "section": "IPC 304", "title": "Culpable Homicide Not Amounting to Murder", "code": "ipc", "punishment": "Imprisonment up to 2 years or fine up to 1000 or both", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
        {"value": "307", "label": "IPC 307 - Attempt to Murder", "section": "IPC 307", "title": "Attempt to Murder", "code": "ipc", "punishment": "Imprisonment up to 10 years or fine up to 1000 or both", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "308", "label": "IPC 308 - Attempt to Commit Culpable Homicide", "section": "IPC 308", "title": "Attempt to Commit Culpable Homicide", "code": "ipc", "punishment": "Imprisonment up to 3 years or fine up to 500 or both", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
        {"value": "323", "label": "IPC 323 - Causing Hurt", "section": "IPC 323", "title": "Causing Hurt", "code": "ipc", "punishment": "Imprisonment up to 3 months or fine up to 250 or both", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
        {"value": "325", "label": "IPC 325 - Voluntarily Causing Grievous Hurt", "section": "IPC 325", "title": "Voluntarily Causing Grievous Hurt", "code": "ipc", "punishment": "Imprisonment up to 7 years or fine up to 1000 or both", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
        {"value": "376", "label": "IPC 376 - Rape", "section": "IPC 376", "title": "Rape", "code": "ipc", "punishment": "Imprisonment up to 10 years and fine or life imprisonment and fine or death", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "377", "label": "IPC 377 - Unnatural Offence", "section": "IPC 377", "title": "Unnatural Offence", "code": "ipc", "punishment": "Imprisonment up to life or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Persons"},
        {"value": "380", "label": "IPC 380 - Theft", "section": "IPC 380", "title": "Theft", "code": "ipc", "punishment": "Imprisonment up to 3 years or fine up to 500 or both", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "420", "label": "IPC 420 - Cheating and Dishonestly Inducing Delivery", "section": "IPC 420", "title": "Cheating and Dishonestly Inducing Delivery of Property", "code": "ipc", "punishment": "Imprisonment up to 7 years or fine or both", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "450", "label": "IPC 450 - House-Trespass", "section": "IPC 450", "title": "House-Trespass", "code": "ipc", "punishment": "Imprisonment up to 3 months or fine up to 250 or both", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "499", "label": "IPC 499 - Defamation", "section": "IPC 499", "title": "Defamation", "code": "ipc", "punishment": "Simple imprisonment up to 2 years or fine up to 2500 or both", "bailable": True, "cognizable": False, "category": "Offences Relating to Elections"},
        {"value": "504", "label": "IPC 504 - Intentional Insult with Intent to Provoke Breach", "section": "IPC 504", "title": "Intentional Insult with Intent to Provoke Breach of Peace", "code": "ipc", "punishment": "Imprisonment up to 2 years or fine up to 1000 or both", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
        {"value": "505", "label": "IPC 505 - Statements Conducing to Public Mischief", "section": "IPC 505", "title": "Statements Conducing to Public Mischief", "code": "ipc", "punishment": "Imprisonment up to 3 years or fine up to 500 or both", "bailable": True, "cognizable": True, "category": "Public Tranquility"},
        {"value": "511", "label": "IPC 511 - Punishment for Attempting Offences", "section": "IPC 511", "title": "Punishment for Attempting to Commit Offences", "code": "ipc", "punishment": "Varies based on substantive offence", "bailable": True, "cognizable": True, "category": "General"},
    ]
    
    bns_sections = [
        {"value": "103", "label": "BNS 103 - Murder", "section": "BNS 103", "title": "Murder", "code": "bns", "punishment": "Life imprisonment or death", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "104", "label": "BNS 104 - Culpable Homicide", "section": "BNS 104", "title": "Culpable Homicide Not Amounting to Murder", "code": "bns", "punishment": "Imprisonment up to 2 years and fine up to 10000", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
        {"value": "105", "label": "BNS 105 - Attempt to Murder", "section": "BNS 105", "title": "Attempt to Murder", "code": "bns", "punishment": "Imprisonment up to 10 years and fine up to 10000", "bailable": False, "cognizable": True, "category": "Offences Against Life"},
        {"value": "106", "label": "BNS 106 - Attempt Culpable Homicide", "section": "BNS 106", "title": "Attempt to Commit Culpable Homicide", "code": "bns", "punishment": "Imprisonment up to 3 years and fine up to 5000", "bailable": True, "cognizable": True, "category": "Offences Against Life"},
        {"value": "118", "label": "BNS 118 - Causing Hurt", "section": "BNS 118", "title": "Causing Hurt", "code": "bns", "punishment": "Imprisonment up to 3 months or fine up to 2500 or both", "bailable": True, "cognizable": False, "category": "Offences Against Body"},
        {"value": "120", "label": "BNS 120 - Voluntarily Causing Grievous Hurt", "section": "BNS 120", "title": "Voluntarily Causing Grievous Hurt", "code": "bns", "punishment": "Imprisonment up to 7 years and fine up to 10000", "bailable": False, "cognizable": True, "category": "Offences Against Body"},
        {"value": "69", "label": "BNS 69 - Rape", "section": "BNS 69", "title": "Rape", "code": "bns", "punishment": "Imprisonment up to 10 years and fine up to 10000 or life imprisonment and fine or death", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "70", "label": "BNS 70 - Sexual Assault", "section": "BNS 70", "title": "Sexual Assault", "code": "bns", "punishment": "Imprisonment up to 5 years and fine up to 5000", "bailable": False, "cognizable": True, "category": "Offences Against Women"},
        {"value": "77", "label": "BNS 77 - Unnatural Offence", "section": "BNS 77", "title": "Unnatural Offence", "code": "bns", "punishment": "Imprisonment up to life and fine", "bailable": False, "cognizable": True, "category": "Offences Against Persons"},
        {"value": "303", "label": "BNS 303 - Theft", "section": "BNS 303", "title": "Theft", "code": "bns", "punishment": "Imprisonment up to 3 years and fine up to 10000", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "318", "label": "BNS 318 - Cheating", "section": "BNS 318", "title": "Cheating and Dishonestly Inducing Delivery of Property", "code": "bns", "punishment": "Imprisonment up to 7 years and fine up to 10000", "bailable": False, "cognizable": True, "category": "Offences Against Property"},
        {"value": "331", "label": "BNS 331 - House-Trespass", "section": "BNS 331", "title": "House-Trespass", "code": "bns", "punishment": "Imprisonment up to 3 months or fine up to 5000 or both", "bailable": True, "cognizable": True, "category": "Offences Against Property"},
        {"value": "152", "label": "BNS 152 - Defamation", "section": "BNS 152", "title": "Defamation", "code": "bns", "punishment": "Simple imprisonment up to 2 years or fine up to 5000 or both", "bailable": True, "cognizable": False, "category": "Offences Relating to Elections"},
        {"value": "192", "label": "BNS 192 - Intentional Insult", "section": "BNS 192", "title": "Intentional Insult with Intent to Provoke Breach of Peace", "code": "bns", "punishment": "Imprisonment up to 2 years or fine up to 5000 or both", "bailable": True, "cognizable": False, "category": "Public Tranquility"},
        {"value": "196", "label": "BNS 196 - Public Mischief", "section": "BNS 196", "title": "Statements Conducing to Public Mischief", "code": "bns", "punishment": "Imprisonment up to 3 years or fine up to 5000 or both", "bailable": True, "cognizable": True, "category": "Public Tranquility"},
    ]
    
    if code_type.lower() == 'ipc':
        sections = ipc_sections
    elif code_type.lower() == 'bns':
        sections = bns_sections
    else:
        sections = ipc_sections + bns_sections
    
    return JSONResponse({"success": True, "data": {"sections": sections}})

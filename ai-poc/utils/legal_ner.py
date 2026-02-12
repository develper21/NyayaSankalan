"""
Legal Domain NER (Named Entity Recognition) Model
Provides enhanced entity extraction for Indian legal documents
"""
import re
import json
import os
from typing import Dict, List, Any, Optional
from pathlib import Path

# IPC/BNS section patterns
IPC_PATTERN = re.compile(r"IPC\s*(\d{1,4}[A-Z]?)", re.IGNORECASE)
BNS_PATTERN = re.compile(r"BNS\s*(\d{1,4}[A-Z]?)", re.IGNORECASE)
SECTION_PATTERN = re.compile(r"Section\s*(\d{1,4}[A-Z]?)", re.IGNORECASE)

# Case citation patterns
CASE_CITATION_PATTERNS = [
    re.compile(r"\d{4}\s+(?:AIR|SCC|SCR|Cri\.?LJ)\s+\d+", re.IGNORECASE),
    re.compile(r"AIR\s+\d{4}\s+(?:SC|HC|SCC)\s+\d+", re.IGNORECASE),
    re.compile(r"\(\d{4}\)\s+\d+\s+(?:SCC|SCR)\s+\d+", re.IGNORECASE),
]

# Court name patterns
COURT_PATTERNS = [
    r"Supreme Court of India",
    r"Supreme Court",
    r"High Court",
    r"Delhi High Court",
    r"Bombay High Court",
    r"Madras High Court",
    r"Calcutta High Court",
    r"District Court",
    r"Sessions Court",
    r"Magistrate Court",
    r"Chief Judicial Magistrate",
    r"CJM Court",
]

# Legal terms
LEGAL_TERMS = [
    "bail", "remand", "cognizance", "charge sheet", "chargesheet",
    "FIR", "complaint", "witness", "accused", "victim", "prosecution",
    "defense", "evidence", "testimony", "deposition", "summons",
    "warrant", "arrest", "custody", "investigation", "trial",
    "judgment", "verdict", "sentence", "appeal", "revision",
    "acquittal", "conviction", "probation", "parole"
]


class LegalNER:
    """Enhanced NER for Indian legal documents"""
    
    def __init__(self):
        self.ipc_sections = self._load_sections("ipc_sections.json")
        self.bns_sections = self._load_sections("bns_sections.json")
        self.spacy_model = None
        self._load_spacy_model()
    
    def _load_sections(self, filename: str) -> Dict:
        """Load IPC/BNS section database"""
        try:
            data_dir = Path(__file__).parent.parent / "data"
            file_path = data_dir / filename
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load {filename}: {e}")
        return {"sections": []}
    
    def _load_spacy_model(self):
        """Load spaCy model (with fallback)"""
        try:
            import spacy
            # Try to load transformer model first, fallback to small model
            try:
                self.spacy_model = spacy.load("en_core_web_trf")
            except:
                try:
                    self.spacy_model = spacy.load("en_core_web_sm")
                except:
                    print("Warning: No spaCy model loaded. Install with: python -m spacy download en_core_web_sm")
                    self.spacy_model = None
        except ImportError:
            print("Warning: spaCy not installed")
            self.spacy_model = None
    
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract all legal entities from text
        
        Returns:
            Dictionary with entity types and extracted entities
        """
        entities = {
            "ipc_sections": [],
            "bns_sections": [],
            "case_citations": [],
            "court_names": [],
            "legal_terms": [],
            "persons": [],
            "organizations": [],
            "dates": [],
            "locations": []
        }
        
        # Extract IPC sections
        ipc_matches = IPC_PATTERN.findall(text)
        for match in ipc_matches:
            section_num = match.strip()
            section_key = f"IPC {section_num}"
            entities["ipc_sections"].append({
                "section": section_key,
                "number": section_num,
                "details": self._get_section_details(section_key, "ipc")
            })
        
        # Extract BNS sections
        bns_matches = BNS_PATTERN.findall(text)
        for match in bns_matches:
            section_num = match.strip()
            section_key = f"BNS {section_num}"
            entities["bns_sections"].append({
                "section": section_key,
                "number": section_num,
                "details": self._get_section_details(section_key, "bns")
            })
        
        # Extract generic "Section" mentions
        section_matches = SECTION_PATTERN.findall(text)
        for match in section_matches:
            if not any(match in str(ipc) for ipc in ipc_matches + bns_matches):
                entities["ipc_sections"].append({
                    "section": f"Section {match}",
                    "number": match.strip(),
                    "details": None
                })
        
        # Extract case citations
        for pattern in CASE_CITATION_PATTERNS:
            citations = pattern.findall(text)
            entities["case_citations"].extend(citations)
        
        # Extract court names
        for court_pattern in COURT_PATTERNS:
            matches = re.finditer(court_pattern, text, re.IGNORECASE)
            for match in matches:
                entities["court_names"].append(match.group(0))
        
        # Extract legal terms
        text_lower = text.lower()
        for term in LEGAL_TERMS:
            if term.lower() in text_lower:
                entities["legal_terms"].append(term)
        
        # Use spaCy for persons, organizations, dates, locations
        if self.spacy_model:
            doc = self.spacy_model(text)
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    entities["persons"].append(ent.text)
                elif ent.label_ in ("ORG", "GPE"):
                    entities["organizations"].append(ent.text)
                elif ent.label_ == "DATE":
                    entities["dates"].append(ent.text)
                elif ent.label_ in ("LOC", "GPE"):
                    entities["locations"].append(ent.text)
        
        # Remove duplicates
        for key in entities:
            if isinstance(entities[key], list) and key not in ["ipc_sections", "bns_sections"]:
                entities[key] = list(set(entities[key]))
        
        return entities
    
    def _get_section_details(self, section: str, section_type: str) -> Optional[Dict]:
        """Get details for a specific section"""
        sections_db = self.ipc_sections if section_type == "ipc" else self.bns_sections
        
        for sec in sections_db.get("sections", []):
            if sec.get("section") == section:
                return {
                    "title": sec.get("title"),
                    "description": sec.get("description"),
                    "punishment": sec.get("punishment"),
                    "bailable": sec.get("bailable"),
                    "cognizable": sec.get("cognizable"),
                    "category": sec.get("category")
                }
        return None
    
    def extract_and_redact(self, text: str) -> Dict[str, Any]:
        """
        Extract entities and create redacted version
        
        Returns:
            Dictionary with entities and redacted text
        """
        entities = self.extract_entities(text)
        
        # Create redacted text
        redacted_text = text
        
        # Redact persons
        for person in entities["persons"]:
            redacted_text = redacted_text.replace(person, "[REDACTED_PERSON]")
        
        # Redact phone numbers
        phone_pattern = re.compile(r"\b\d{10,13}\b")
        redacted_text = phone_pattern.sub("[REDACTED_PHONE]", redacted_text)
        
        # Redact email addresses
        email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
        redacted_text = email_pattern.sub("[REDACTED_EMAIL]", redacted_text)
        
        return {
            "entities": entities,
            "redacted_text": redacted_text,
            "entity_count": {
                "ipc_sections": len(entities["ipc_sections"]),
                "bns_sections": len(entities["bns_sections"]),
                "case_citations": len(entities["case_citations"]),
                "court_names": len(entities["court_names"]),
                "legal_terms": len(entities["legal_terms"]),
                "persons": len(entities["persons"])
            }
        }


# Singleton instance
_legal_ner_instance = None

def get_legal_ner() -> LegalNER:
    """Get or create Legal NER instance"""
    global _legal_ner_instance
    if _legal_ner_instance is None:
        _legal_ner_instance = LegalNER()
    return _legal_ner_instance

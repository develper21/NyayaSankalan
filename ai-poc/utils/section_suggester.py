"""
Section Suggester - Recommends IPC/BNS sections based on case facts
Uses keyword matching and semantic similarity
"""
import json
import re
from typing import Dict, List, Any, Optional
from pathlib import Path
from rank_bm25 import BM25Okapi
from .logger import get_logger

logger = get_logger(__name__)


class SectionSuggester:
    """Suggest relevant IPC/BNS sections based on case description"""
    
    def __init__(self):
        logger.info("Initializing Section Suggester")
        self.ipc_sections = self._load_sections("ipc_sections.json")
        self.bns_sections = self._load_sections("bns_sections.json")
        logger.info("Sections loaded", ipc_count=len(self.ipc_sections), bns_count=len(self.bns_sections))
        self.bm25_index_ipc = None
        self.bm25_index_bns = None
        self._build_bm25_indexes()
        logger.info("Section Suggester initialized successfully")
    
    def _load_sections(self, filename: str) -> List[Dict]:
        """Load section database"""
        try:
            data_dir = Path(__file__).parent.parent / "data"
            file_path = data_dir / filename
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get("sections", [])
        except Exception as e:
            print(f"Warning: Could not load {filename}: {e}")
        return []
    
    def _build_bm25_indexes(self):
        """Build BM25 indexes for fast retrieval"""
        # Tokenize IPC sections
        ipc_corpus = []
        for section in self.ipc_sections:
            # Combine keywords, title, and description for indexing
            text = " ".join([
                " ".join(section.get("keywords", [])),
                section.get("title", ""),
                section.get("description", "")
            ])
            ipc_corpus.append(text.lower().split())
        
        if ipc_corpus:
            self.bm25_index_ipc = BM25Okapi(ipc_corpus)
        
        # Tokenize BNS sections
        bns_corpus = []
        for section in self.bns_sections:
            text = " ".join([
                " ".join(section.get("keywords", [])),
                section.get("title", ""),
                section.get("description", "")
            ])
            bns_corpus.append(text.lower().split())
        
        if bns_corpus:
            self.bm25_index_bns = BM25Okapi(bns_corpus)
    
    def suggest_sections(
        self,
        case_description: str,
        top_k: int = 5,
        code_type: str = "both"  # "ipc", "bns", or "both"
    ) -> Dict[str, Any]:
        """
        Suggest relevant sections based on case description
        
        Args:
            case_description: Description of the case/incident
            top_k: Number of top sections to return
            code_type: Which code to use ("ipc", "bns", or "both")
        
        Returns:
            Dictionary with suggested sections and confidence scores
        """
        query_tokens = case_description.lower().split()
        suggestions = []
        
        # Get IPC suggestions
        if code_type in ["ipc", "both"] and self.bm25_index_ipc:
            ipc_scores = self.bm25_index_ipc.get_scores(query_tokens)
            ipc_suggestions = self._get_top_sections(
                self.ipc_sections,
                ipc_scores,
                top_k,
                "IPC"
            )
            suggestions.extend(ipc_suggestions)
        
        # Get BNS suggestions
        if code_type in ["bns", "both"] and self.bm25_index_bns:
            bns_scores = self.bm25_index_bns.get_scores(query_tokens)
            bns_suggestions = self._get_top_sections(
                self.bns_sections,
                bns_scores,
                top_k,
                "BNS"
            )
            suggestions.extend(bns_suggestions)
        
        # Sort by score and return top_k
        suggestions.sort(key=lambda x: x["confidence"], reverse=True)
        suggestions = suggestions[:top_k]
        
        return {
            "query": case_description,
            "suggestions": suggestions,
            "total_found": len(suggestions)
        }
    
    def _get_top_sections(
        self,
        sections: List[Dict],
        scores: List[float],
        top_k: int,
        code_prefix: str
    ) -> List[Dict]:
        """Get top k sections with highest scores"""
        # Get top indices
        import numpy as np
        top_indices = np.argsort(scores)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            if scores[idx] > 0:  # Only include sections with positive scores
                section = sections[idx]
                
                # Find matching keywords from query for explanation
                matched_keywords = self._find_matched_keywords(section.get("keywords", []), scores[idx])
                
                # Get corresponding IPC/BNS equivalent
                equivalent_section = None
                if code_prefix == "BNS" and section.get("ipc_equivalent"):
                    equivalent_section = self._find_section_by_number(section.get("ipc_equivalent"), "IPC")
                elif code_prefix == "IPC":
                    # Find BNS equivalent by looking for this IPC number in BNS ipc_equivalent field
                    equivalent_section = self._find_bns_for_ipc(section.get("number"))
                
                results.append({
                    "section": section.get("section"),
                    "number": section.get("number"),
                    "title": section.get("title"),
                    "description": section.get("description"),
                    "keywords": section.get("keywords", []),
                    "matched_keywords": matched_keywords,
                    "punishment": section.get("punishment"),
                    "bailable": section.get("bailable"),
                    "cognizable": section.get("cognizable"),
                    "category": section.get("category"),
                    "confidence": round(min(scores[idx] / 10.0, 1.0), 2),  # Normalize to 0-1
                    "code_type": code_prefix,
                    "equivalent": equivalent_section,
                    "explanation": self._generate_explanation(matched_keywords, section.get("title"), code_prefix)
                })
        
        return results
    
    def _find_matched_keywords(self, keywords: List[str], score: float) -> List[str]:
        """Return top matched keywords based on score"""
        if score > 5:
            return keywords[:3]  # Return top 3 keywords for high scores
        elif score > 2:
            return keywords[:2]
        return keywords[:1] if keywords else []
    
    def _find_section_by_number(self, number: str, code_type: str) -> Optional[Dict]:
        """Find section details by number"""
        sections = self.ipc_sections if code_type == "IPC" else self.bns_sections
        for section in sections:
            if section.get("number") == number:
                return {
                    "section": section.get("section"),
                    "title": section.get("title"),
                    "number": section.get("number")
                }
        return None
    
    def _find_bns_for_ipc(self, ipc_number: str) -> Optional[Dict]:
        """Find BNS equivalent for an IPC section"""
        for section in self.bns_sections:
            if section.get("ipc_equivalent") == ipc_number:
                return {
                    "section": section.get("section"),
                    "title": section.get("title"),
                    "number": section.get("number")
                }
        return None
    
    def _generate_explanation(self, matched_keywords: List[str], title: str, code_type: str) -> str:
        """Generate explanation for why this section was suggested"""
        if not matched_keywords:
            return f"Suggested based on case context and legal category"
        
        keywords_str = ", ".join(matched_keywords)
        return f"Matched keywords: {keywords_str} → {title}"
    
    def suggest_by_keywords(
        self,
        keywords: List[str],
        code_type: str = "both"
    ) -> List[Dict]:
        """
        Suggest sections based on specific keywords
        
        Args:
            keywords: List of keywords to match
            code_type: Which code to use
        
        Returns:
            List of matching sections
        """
        results = []
        keywords_lower = [k.lower() for k in keywords]
        
        # Search IPC
        if code_type in ["ipc", "both"]:
            for section in self.ipc_sections:
                section_keywords = [k.lower() for k in section.get("keywords", [])]
                matches = set(keywords_lower) & set(section_keywords)
                if matches:
                    results.append({
                        "section": section.get("section"),
                        "number": section.get("number"),
                        "title": section.get("title"),
                        "matched_keywords": list(matches),
                        "code_type": "IPC"
                    })
        
        # Search BNS
        if code_type in ["bns", "both"]:
            for section in self.bns_sections:
                section_keywords = [k.lower() for k in section.get("keywords", [])]
                matches = set(keywords_lower) & set(section_keywords)
                if matches:
                    results.append({
                        "section": section.get("section"),
                        "number": section.get("number"),
                        "title": section.get("title"),
                        "matched_keywords": list(matches),
                        "code_type": "BNS",
                        "ipc_equivalent": section.get("ipc_equivalent")
                    })
        
        return results
    
    def get_section_details(self, section_number: str, code_type: str = "ipc") -> Optional[Dict]:
        """Get detailed information about a specific section"""
        sections = self.ipc_sections if code_type.lower() == "ipc" else self.bns_sections
        section_key = f"{code_type.upper()} {section_number}"
        
        for section in sections:
            if section.get("section") == section_key or section.get("number") == section_number:
                return section
        
        return None
    
    def get_related_sections(self, section_number: str, code_type: str = "ipc") -> List[Dict]:
        """Get sections related to a given section (same category)"""
        section = self.get_section_details(section_number, code_type)
        if not section:
            return []
        
        category = section.get("category")
        if not category:
            return []
        
        sections = self.ipc_sections if code_type.lower() == "ipc" else self.bns_sections
        related = []
        
        for sec in sections:
            if (sec.get("category") == category and 
                sec.get("section") != section.get("section")):
                related.append({
                    "section": sec.get("section"),
                    "number": sec.get("number"),
                    "title": sec.get("title"),
                    "category": sec.get("category")
                })
        
        return related[:5]  # Return top 5 related sections


# Singleton instance
_section_suggester_instance = None

def get_section_suggester() -> SectionSuggester:
    """Get or create Section Suggester instance"""
    global _section_suggester_instance
    if _section_suggester_instance is None:
        _section_suggester_instance = SectionSuggester()
    return _section_suggester_instance

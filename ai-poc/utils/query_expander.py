"""
Query Expander - Expands search queries with legal synonyms
"""
import json
from typing import List, Set
from pathlib import Path


class QueryExpander:
    """Expand search queries with legal synonyms and related terms"""
    
    def __init__(self):
        self.synonyms = self._load_synonyms()
        self.section_mappings = {}
        self._load_section_mappings()
    
    def _load_synonyms(self) -> dict:
        """Load legal synonyms database"""
        try:
            data_dir = Path(__file__).parent.parent / "data"
            file_path = data_dir / "legal_synonyms.json"
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get("synonyms", {})
        except Exception as e:
            print(f"Warning: Could not load synonyms: {e}")
        return {}
    
    def _load_section_mappings(self):
        """Load section mappings for query expansion"""
        try:
            data_dir = Path(__file__).parent.parent / "data"
            file_path = data_dir / "legal_synonyms.json"
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.section_mappings = data.get("section_mappings", {})
        except Exception as e:
            print(f"Warning: Could not load section mappings: {e}")
    
    def expand_query(self, query: str, max_expansions: int = 3) -> str:
        """
        Expand query with synonyms and related terms
        
        Args:
            query: Original search query
            max_expansions: Maximum number of synonyms per term
        
        Returns:
            Expanded query string
        """
        query_lower = query.lower()
        expanded_terms = set([query_lower])
        
        # Find matching terms and add their synonyms
        for term, synonyms in self.synonyms.items():
            if term in query_lower:
                # Add original term
                expanded_terms.add(term)
                # Add synonyms (limited by max_expansions)
                expanded_terms.update(synonyms[:max_expansions])
        
        return " OR ".join(expanded_terms)
    
    def expand_with_sections(self, query: str) -> str:
        """
        Expand query with relevant section numbers
        
        Args:
            query: Original search query
        
        Returns:
            Expanded query with section numbers
        """
        query_lower = query.lower()
        expanded_terms = [query]
        
        # Check for matching offense types
        for offense, sections in self.section_mappings.items():
            if offense in query_lower:
                expanded_terms.extend(sections)
        
        return " ".join(expanded_terms)
    
    def get_synonyms(self, term: str) -> List[str]:
        """Get synonyms for a specific term"""
        term_lower = term.lower()
        return self.synonyms.get(term_lower, [])
    
    def expand_legal_terms(self, text: str) -> Set[str]:
        """
        Extract and expand all legal terms in text
        
        Returns:
            Set of original terms + their synonyms
        """
        all_terms = set()
        text_lower = text.lower()
        
        for term, synonyms in self.synonyms.items():
            if term in text_lower:
                all_terms.add(term)
                all_terms.update(synonyms)
        
        return all_terms


# Singleton instance
_query_expander_instance = None

def get_query_expander() -> QueryExpander:
    """Get or create Query Expander instance"""
    global _query_expander_instance
    if _query_expander_instance is None:
        _query_expander_instance = QueryExpander()
    return _query_expander_instance

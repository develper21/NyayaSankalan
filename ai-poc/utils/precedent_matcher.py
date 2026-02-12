"""
Precedent Matcher - Find similar cases using FAISS semantic search
"""
import os
import json
from typing import Dict, List, Any, Optional
from pathlib import Path


class PrecedentMatcher:
    """Find similar cases and precedents using semantic search"""
    
    def __init__(self):
        self.faiss_index = None
        self.embeddings_model = None
        self.metadata = []
        self.min_similarity_threshold = 0.35  # Minimum 35% similarity
        self._load_models()
    
    def _load_models(self):
        """Load FAISS index and embedding model"""
        try:
            # Load embedding model
            from sentence_transformers import SentenceTransformer
            self.embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Try to load existing FAISS index
            storage_dir = Path(__file__).parent.parent / "storage" / "indexes"
            index_path = storage_dir / "faiss.index"
            meta_path = storage_dir / "meta.json"
            
            if index_path.exists() and meta_path.exists():
                import faiss
                self.faiss_index = faiss.read_index(str(index_path))
                
                with open(meta_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Extract items list from the meta JSON structure
                    self.metadata = data.get('items', []) if isinstance(data, dict) else data
                
                print(f"Loaded FAISS index with {len(self.metadata)} documents")
            else:
                print("Warning: FAISS index not found. Create one first.")
                
        except Exception as e:
            print(f"Warning: Could not load precedent matcher: {e}")
    
    def find_similar_cases(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Find similar cases based on case description
        
        Args:
            query: Case description or facts
            top_k: Number of similar cases to return
            filters: Optional filters (e.g., {"section": "IPC 302"})
        
        Returns:
            Dictionary with similar cases and similarity scores
        """
        if not self.faiss_index or not self.embeddings_model:
            return {
                "error": "FAISS index or embedding model not loaded",
                "similar_cases": []
            }
        
        try:
            # Generate embedding for query
            query_embedding = self.embeddings_model.encode([query])
            
            # Search FAISS index
            distances, indices = self.faiss_index.search(query_embedding, top_k * 2)
            
            # Get results with metadata
            results = []
            for idx, distance in zip(indices[0], distances[0]):
                idx = int(idx)  # Convert numpy int to Python int
                distance = float(distance)  # Convert numpy float to Python float
                
                if idx < len(self.metadata):
                    case_meta = self.metadata[idx]
                    
                    # Apply filters if provided
                    if filters:
                        if not self._matches_filters(case_meta, filters):
                            continue
                    
                    similarity = float(1 / (1 + distance))  # Convert distance to similarity
                    
                    # CRITICAL: Filter out low-relevance results
                    if similarity < self.min_similarity_threshold:
                        continue
                    
                    # Extract info from snippet if structured fields don't exist
                    snippet = case_meta.get("snippet", "")
                    sections_list = []
                    court_name = None
                    year_val = None
                    title = case_meta.get("title", "")
                    
                    # Try to extract sections from snippet
                    if "Sections:" in snippet or "IPC" in snippet or "BNS" in snippet:
                        import re
                        # Find IPC/BNS sections in snippet
                        ipc_matches = re.findall(r'IPC\s*\d+', snippet)
                        bns_matches = re.findall(r'BNS\s*\d+', snippet)
                        sections_list = list(set(ipc_matches + bns_matches))  # Remove duplicates
                    
                    # Extract court if present
                    if "Police Station:" in snippet:
                        lines = snippet.split('\n')
                        for line in lines:
                            if "Police Station:" in line:
                                court_name = line.split("Police Station:")[-1].strip()
                                break
                    
                    # Extract year from dates in snippet
                    import re
                    year_matches = re.findall(r'20\d{2}', snippet)
                    if year_matches:
                        year_val = int(year_matches[0])
                    
                    # Generate title from snippet if not present
                    if not title:
                        if "Nature of Offence:" in snippet:
                            title = snippet.split("Nature of Offence:")[-1].split('\n')[0].strip()
                        elif "FIR Number:" in snippet:
                            title = snippet.split("FIR Number:")[-1].split('\n')[0].strip()
                        else:
                            title = snippet[:100] + "..."
                    
                    results.append({
                        "case_id": case_meta.get("id"),
                        "title": title or case_meta.get("sourceFile", "Unknown Case"),
                        "description": snippet[:300] + ("..." if len(snippet) > 300 else ""),
                        "sections": sections_list or case_meta.get("sections", []),
                        "year": year_val or case_meta.get("year"),
                        "court": court_name or case_meta.get("court", ""),
                        "similarity": round(similarity, 3),
                        "file_path": case_meta.get("file_path") or case_meta.get("sourceFile")
                    })
                    
                    if len(results) >= top_k:
                        break
            
            return {
                "query": query,
                "similar_cases": results,
                "total_found": len(results)
            }
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "similar_cases": [],
                "total_found": 0
            }
    
    def _matches_filters(self, case_meta: Dict, filters: Dict) -> bool:
        """Check if case matches the given filters"""
        for key, value in filters.items():
            if key == "section":
                # Check if section is in the case
                sections = case_meta.get("sections", [])
                if value not in sections:
                    return False
            elif key == "year":
                if case_meta.get("year") != value:
                    return False
            elif key == "court":
                if case_meta.get("court") != value:
                    return False
            elif key in case_meta:
                if case_meta[key] != value:
                    return False
        return True
    
    def find_precedents_by_section(
        self,
        section: str,
        top_k: int = 10
    ) -> List[Dict]:
        """
        Find precedents that cite a specific section
        
        Args:
            section: Section number (e.g., "IPC 302", "BNS 103")
            top_k: Number of cases to return
        
        Returns:
            List of cases citing this section
        """
        results = []
        
        for case_meta in self.metadata:
            sections = case_meta.get("sections", [])
            if section in sections or any(section in s for s in sections):
                results.append({
                    "case_id": case_meta.get("id"),
                    "title": case_meta.get("title"),
                    "description": case_meta.get("description", ""),
                    "sections": sections,
                    "year": case_meta.get("year"),
                    "court": case_meta.get("court"),
                    "file_path": case_meta.get("file_path")
                })
                
                if len(results) >= top_k:
                    break
        
        return results
    
    def get_case_statistics(self) -> Dict[str, Any]:
        """Get statistics about indexed cases"""
        if not self.metadata:
            return {
                "total_cases": 0,
                "sections": {},
                "courts": {},
                "years": {}
            }
        
        sections_count = {}
        courts_count = {}
        years_count = {}
        
        for case in self.metadata:
            # Count sections
            for section in case.get("sections", []):
                sections_count[section] = sections_count.get(section, 0) + 1
            
            # Count courts
            court = case.get("court", "Unknown")
            courts_count[court] = courts_count.get(court, 0) + 1
            
            # Count years
            year = case.get("year", "Unknown")
            years_count[year] = years_count.get(year, 0) + 1
        
        return {
            "total_cases": len(self.metadata),
            "sections": dict(sorted(sections_count.items(), key=lambda x: x[1], reverse=True)[:10]),
            "courts": courts_count,
            "years": years_count,
            "index_loaded": self.faiss_index is not None
        }


# Singleton instance
_precedent_matcher_instance = None

def get_precedent_matcher() -> PrecedentMatcher:
    """Get or create Precedent Matcher instance"""
    global _precedent_matcher_instance
    if _precedent_matcher_instance is None:
        _precedent_matcher_instance = PrecedentMatcher()
    return _precedent_matcher_instance

"""
Reranker - Re-rank search results using cross-encoder for better relevance
"""
from typing import List, Dict, Any, Optional
import numpy as np


class Reranker:
    """Re-rank search results using cross-encoder model"""
    
    def __init__(self):
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load cross-encoder model"""
        try:
            from sentence_transformers import CrossEncoder
            # Use a lightweight cross-encoder for re-ranking
            self.model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            print("Loaded cross-encoder model for re-ranking")
        except Exception as e:
            print(f"Warning: Could not load cross-encoder: {e}")
            self.model = None
    
    def rerank_results(
        self,
        query: str,
        results: List[Dict[str, Any]],
        text_field: str = "description",
        top_k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Re-rank search results based on query relevance
        
        Args:
            query: Search query
            results: List of search results
            text_field: Field name containing text to compare
            top_k: Return only top k results (None = all)
        
        Returns:
            Re-ranked list of results
        """
        if not self.model or not results:
            return results
        
        try:
            # Prepare query-document pairs
            pairs = []
            for result in results:
                text = result.get(text_field, "")
                if not text and "text" in result:
                    text = result["text"]
                pairs.append([query, text])
            
            # Get relevance scores
            scores = self.model.predict(pairs)
            
            # Add scores to results and sort
            for i, result in enumerate(results):
                result["rerank_score"] = float(scores[i])
            
            # Sort by rerank score
            ranked_results = sorted(
                results,
                key=lambda x: x.get("rerank_score", 0),
                reverse=True
            )
            
            # Return top k if specified
            if top_k:
                ranked_results = ranked_results[:top_k]
            
            return ranked_results
            
        except Exception as e:
            print(f"Re-ranking failed: {e}")
            return results
    
    def score_relevance(self, query: str, text: str) -> float:
        """
        Get relevance score for a single query-text pair
        
        Returns:
            Relevance score (higher = more relevant)
        """
        if not self.model:
            return 0.0
        
        try:
            score = self.model.predict([[query, text]])
            return float(score[0])
        except Exception as e:
            print(f"Scoring failed: {e}")
            return 0.0
    
    def batch_score(
        self,
        query: str,
        texts: List[str]
    ) -> List[float]:
        """
        Score multiple texts for a single query
        
        Returns:
            List of relevance scores
        """
        if not self.model:
            return [0.0] * len(texts)
        
        try:
            pairs = [[query, text] for text in texts]
            scores = self.model.predict(pairs)
            return [float(s) for s in scores]
        except Exception as e:
            print(f"Batch scoring failed: {e}")
            return [0.0] * len(texts)


# Singleton instance
_reranker_instance = None

def get_reranker() -> Reranker:
    """Get or create Reranker instance"""
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = Reranker()
    return _reranker_instance

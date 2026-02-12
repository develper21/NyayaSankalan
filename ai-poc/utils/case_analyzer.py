"""
Case Readiness Checker - Analyzes case completion for SHO
Validates required documents, witness statements, and evidence
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from .logger import get_logger

logger = get_logger(__name__)


class CaseReadinessChecker:
    """Check if a case is ready for court submission"""
    
    # Required documents for different case types
    REQUIRED_DOCUMENTS = {
        "THEFT": ["FIR", "WITNESS_STATEMENT", "SCENE_PHOTOS", "PROPERTY_LIST"],
        "ASSAULT": ["FIR", "MEDICAL_REPORT", "WITNESS_STATEMENT", "SCENE_PHOTOS"],
        "FRAUD": ["FIR", "WITNESS_STATEMENT", "FINANCIAL_RECORDS", "CORRESPONDENCE"],
        "MURDER": ["FIR", "POSTMORTEM_REPORT", "FORENSIC_REPORT", "WITNESS_STATEMENT", "SCENE_PHOTOS"],
        "ROBBERY": ["FIR", "WITNESS_STATEMENT", "SCENE_PHOTOS", "PROPERTY_LIST", "INJURY_REPORT"],
        "KIDNAPPING": ["FIR", "WITNESS_STATEMENT", "MISSING_PERSON_REPORT", "SEARCH_RECORDS"],
        "DRUG_OFFENSE": ["FIR", "SEIZURE_MEMO", "FSL_REPORT", "WITNESS_STATEMENT"],
        "SEXUAL_ASSAULT": ["FIR", "MEDICAL_REPORT", "FORENSIC_REPORT", "WITNESS_STATEMENT"],
        "CYBERCRIME": ["FIR", "DIGITAL_EVIDENCE", "TECHNICAL_ANALYSIS", "CORRESPONDENCE"],
        "DEFAULT": ["FIR", "WITNESS_STATEMENT", "EVIDENCE_LIST"]
    }
    
    # Minimum requirements
    MIN_WITNESSES = {
        "MURDER": 2,
        "SEXUAL_ASSAULT": 1,
        "ROBBERY": 2,
        "DEFAULT": 1
    }
    
    def __init__(self):
        logger.info("Case Readiness Checker initialized")
    
    def check_case_readiness(
        self,
        case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze case for court submission readiness
        
        Args:
            case_data: Dictionary containing case information
                - case_type: Type of case (THEFT, ASSAULT, etc.)
                - documents: List of uploaded document types
                - witnesses: List of witness statements
                - evidence: List of evidence items
                - investigation_status: Current investigation status
                - days_since_registration: Days since FIR registration
        
        Returns:
            Analysis with readiness score, missing items, and recommendations
        """
        logger.info("Checking case readiness", case_id=case_data.get("id"))
        
        case_type = case_data.get("case_type", "DEFAULT").upper()
        documents = case_data.get("documents", [])
        witnesses = case_data.get("witnesses", [])
        evidence = case_data.get("evidence", [])
        investigation_status = case_data.get("investigation_status", "PENDING")
        days_since_registration = case_data.get("days_since_registration", 0)
        
        # Get required documents for this case type
        required_docs = self.REQUIRED_DOCUMENTS.get(
            case_type,
            self.REQUIRED_DOCUMENTS["DEFAULT"]
        )
        
        # Get minimum witnesses required
        min_witnesses = self.MIN_WITNESSES.get(
            case_type,
            self.MIN_WITNESSES["DEFAULT"]
        )
        
        # Check document completeness
        missing_documents = []
        present_documents = []
        for doc_type in required_docs:
            if doc_type in documents:
                present_documents.append(doc_type)
            else:
                missing_documents.append(doc_type)
        
        doc_completeness = len(present_documents) / len(required_docs) if required_docs else 0
        
        # Check witness statements
        witness_count = len(witnesses)
        witness_status = "SUFFICIENT" if witness_count >= min_witnesses else "INSUFFICIENT"
        missing_witnesses = max(0, min_witnesses - witness_count)
        
        # Check evidence items
        evidence_count = len(evidence)
        evidence_status = "PRESENT" if evidence_count > 0 else "MISSING"
        
        # Check investigation timeline
        timeline_status = self._check_timeline(case_type, days_since_registration)
        
        # Calculate overall readiness score (0-100)
        readiness_score = self._calculate_readiness_score(
            doc_completeness,
            witness_count,
            min_witnesses,
            evidence_count,
            investigation_status,
            timeline_status
        )
        
        # Determine if ready for submission
        is_ready = (
            readiness_score >= 80 and
            doc_completeness >= 0.9 and
            witness_count >= min_witnesses and
            evidence_count > 0
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            missing_documents,
            missing_witnesses,
            evidence_count,
            investigation_status,
            timeline_status
        )
        
        # Identify blockers
        blockers = self._identify_blockers(
            missing_documents,
            witness_count,
            min_witnesses,
            evidence_count
        )
        
        result = {
            "ready_for_submission": is_ready,
            "readiness_score": round(readiness_score, 1),
            "status": "READY" if is_ready else "NOT_READY",
            "case_type": case_type,
            "document_analysis": {
                "completeness": round(doc_completeness * 100, 1),
                "present": present_documents,
                "missing": missing_documents,
                "total_required": len(required_docs)
            },
            "witness_analysis": {
                "count": witness_count,
                "required": min_witnesses,
                "status": witness_status,
                "missing": missing_witnesses
            },
            "evidence_analysis": {
                "count": evidence_count,
                "status": evidence_status
            },
            "timeline_analysis": timeline_status,
            "blockers": blockers,
            "recommendations": recommendations,
            "checked_at": datetime.utcnow().isoformat() + "Z"
        }
        
        logger.info(
            "Case readiness check complete",
            case_id=case_data.get("id"),
            ready=is_ready,
            score=readiness_score
        )
        
        return result
    
    def _check_timeline(self, case_type: str, days_elapsed: int) -> Dict[str, Any]:
        """Check if investigation timeline is appropriate"""
        # Expected timeline in days for different case types
        expected_timeline = {
            "MURDER": 60,
            "SEXUAL_ASSAULT": 60,
            "KIDNAPPING": 45,
            "ROBBERY": 30,
            "ASSAULT": 30,
            "THEFT": 30,
            "FRAUD": 45,
            "DEFAULT": 30
        }
        
        expected = expected_timeline.get(case_type, expected_timeline["DEFAULT"])
        
        if days_elapsed > expected * 1.5:
            status = "DELAYED"
            message = f"Investigation exceeds expected timeline ({expected} days)"
        elif days_elapsed > expected:
            status = "NEARING_LIMIT"
            message = f"Investigation approaching timeline limit ({expected} days)"
        else:
            status = "ON_TRACK"
            message = f"Investigation within expected timeline ({expected} days)"
        
        return {
            "status": status,
            "days_elapsed": days_elapsed,
            "expected_days": expected,
            "message": message
        }
    
    def _calculate_readiness_score(
        self,
        doc_completeness: float,
        witness_count: int,
        min_witnesses: int,
        evidence_count: int,
        investigation_status: str,
        timeline_status: Dict[str, Any]
    ) -> float:
        """Calculate overall readiness score (0-100)"""
        # Document completeness: 40% weight
        doc_score = doc_completeness * 40
        
        # Witness sufficiency: 25% weight
        witness_ratio = min(witness_count / min_witnesses, 1.0) if min_witnesses > 0 else 1.0
        witness_score = witness_ratio * 25
        
        # Evidence presence: 15% weight
        evidence_score = 15 if evidence_count > 0 else 0
        
        # Investigation status: 10% weight
        status_score = {
            "COMPLETED": 10,
            "ONGOING": 7,
            "PENDING": 3,
            "UNDER_INVESTIGATION": 7
        }.get(investigation_status, 5)
        
        # Timeline adherence: 10% weight
        timeline_score = {
            "ON_TRACK": 10,
            "NEARING_LIMIT": 7,
            "DELAYED": 3
        }.get(timeline_status["status"], 5)
        
        total_score = doc_score + witness_score + evidence_score + status_score + timeline_score
        
        return min(total_score, 100)
    
    def _generate_recommendations(
        self,
        missing_documents: List[str],
        missing_witnesses: int,
        evidence_count: int,
        investigation_status: str,
        timeline_status: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Document recommendations
        if missing_documents:
            priority_docs = [doc for doc in missing_documents if doc in ["FIR", "MEDICAL_REPORT", "POSTMORTEM_REPORT"]]
            if priority_docs:
                recommendations.append(f"URGENT: Upload critical documents: {', '.join(priority_docs)}")
            else:
                recommendations.append(f"Upload missing documents: {', '.join(missing_documents[:3])}")
        
        # Witness recommendations
        if missing_witnesses > 0:
            recommendations.append(f"Record {missing_witnesses} more witness statement(s)")
        
        # Evidence recommendations
        if evidence_count == 0:
            recommendations.append("Add evidence items to strengthen the case")
        
        # Timeline recommendations
        if timeline_status["status"] == "DELAYED":
            recommendations.append("Case investigation is delayed - expedite pending tasks")
        elif timeline_status["status"] == "NEARING_LIMIT":
            recommendations.append("Complete investigation soon to meet timeline expectations")
        
        # Investigation status recommendations
        if investigation_status in ["PENDING", "ONGOING"]:
            recommendations.append("Complete all pending investigation activities")
        
        if not recommendations:
            recommendations.append("Case is ready for court submission")
        
        return recommendations
    
    def _identify_blockers(
        self,
        missing_documents: List[str],
        witness_count: int,
        min_witnesses: int,
        evidence_count: int
    ) -> List[str]:
        """Identify critical blockers preventing submission"""
        blockers = []
        
        # Critical document blockers
        critical_docs = ["FIR", "MEDICAL_REPORT", "POSTMORTEM_REPORT", "FORENSIC_REPORT"]
        critical_missing = [doc for doc in missing_documents if doc in critical_docs]
        if critical_missing:
            blockers.append(f"Missing critical documents: {', '.join(critical_missing)}")
        
        # Witness blocker
        if witness_count < min_witnesses:
            blockers.append(f"Insufficient witness statements ({witness_count}/{min_witnesses})")
        
        # Evidence blocker
        if evidence_count == 0:
            blockers.append("No evidence items recorded")
        
        return blockers


# Singleton instance
_case_analyzer = None


def get_case_analyzer() -> CaseReadinessChecker:
    """Get or create the case readiness checker instance"""
    global _case_analyzer
    if _case_analyzer is None:
        _case_analyzer = CaseReadinessChecker()
    return _case_analyzer

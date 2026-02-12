"""
AI Case Brief Generator - Generates comprehensive case briefs for judges
Summarizes case facts, evidence, legal issues, and suggests key considerations
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import re
from .logger import get_logger

logger = get_logger(__name__)


class CaseBriefGenerator:
    """Generate AI-powered case briefs for judicial review"""
    
    # Key sections in a case brief
    BRIEF_SECTIONS = [
        "case_overview",
        "parties",
        "facts",
        "charges",
        "evidence_summary",
        "legal_issues",
        "precedents",
        "defense_arguments",
        "prosecution_arguments",
        "key_considerations",
        "timeline"
    ]
    
    def __init__(self):
        logger.info("Case Brief Generator initialized")
    
    def generate_case_brief(
        self,
        case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive case brief for judicial review
        
        Args:
            case_data: Dictionary containing case information
                - case_id: Unique case identifier
                - case_number: Court case number
                - case_type: Type of case (THEFT, MURDER, etc.)
                - fir_details: FIR information
                - accused: List of accused persons
                - complainant: Complainant information
                - witnesses: List of witnesses
                - evidence: Evidence items
                - documents: Case documents
                - charges: List of charges/sections
                - timeline: Case timeline events
                - prosecution_summary: Prosecution case summary
                - defense_summary: Defense case summary
                - previous_orders: Previous court orders
        
        Returns:
            Comprehensive case brief with analysis and recommendations
        """
        logger.info("Generating case brief", case_id=case_data.get("case_id"))
        
        case_id = case_data.get("case_id")
        case_number = case_data.get("case_number", "N/A")
        case_type = case_data.get("case_type", "GENERAL")
        
        # Generate each section of the brief
        brief = {
            "case_id": case_id,
            "case_number": case_number,
            "case_type": case_type,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            
            # 1. Case Overview
            "case_overview": self._generate_overview(case_data),
            
            # 2. Parties Information
            "parties": self._extract_parties(case_data),
            
            # 3. Facts Summary
            "facts": self._summarize_facts(case_data),
            
            # 4. Charges/Sections
            "charges": self._analyze_charges(case_data),
            
            # 5. Evidence Summary
            "evidence_summary": self._summarize_evidence(case_data),
            
            # 6. Legal Issues
            "legal_issues": self._identify_legal_issues(case_data),
            
            # 7. Relevant Precedents
            "precedents": self._suggest_precedents(case_data),
            
            # 8. Arguments Summary
            "arguments": {
                "prosecution": self._summarize_prosecution(case_data),
                "defense": self._summarize_defense(case_data)
            },
            
            # 9. Key Considerations for Judge
            "key_considerations": self._generate_considerations(case_data),
            
            # 10. Timeline
            "timeline": self._generate_timeline(case_data),
            
            # 11. Procedural Status
            "procedural_status": self._check_procedural_compliance(case_data),
            
            # 12. Recommendation Areas
            "areas_requiring_attention": self._identify_attention_areas(case_data)
        }
        
        logger.info("Case brief generated successfully", case_id=case_id)
        
        return brief
    
    def _generate_overview(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate high-level case overview"""
        fir = case_data.get("fir_details", {})
        accused = case_data.get("accused", [])
        
        return {
            "case_type": case_data.get("case_type", "GENERAL"),
            "registration_date": fir.get("date", "N/A"),
            "fir_number": fir.get("fir_number", "N/A"),
            "police_station": fir.get("police_station", "N/A"),
            "accused_count": len(accused),
            "status": case_data.get("status", "PENDING"),
            "brief_description": fir.get("brief_description", "")[:200]
        }
    
    def _extract_parties(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and summarize party information"""
        accused = case_data.get("accused", [])
        complainant = case_data.get("complainant", {})
        witnesses = case_data.get("witnesses", [])
        
        return {
            "complainant": {
                "name": complainant.get("name", "N/A"),
                "type": complainant.get("type", "INDIVIDUAL"),
                "represented_by": complainant.get("advocate", "Not specified")
            },
            "accused": [
                {
                    "name": acc.get("name", "Unknown"),
                    "age": acc.get("age"),
                    "custody_status": acc.get("custody_status", "Unknown"),
                    "represented_by": acc.get("advocate", "Not specified"),
                    "bail_status": acc.get("bail_status", "Unknown")
                }
                for acc in accused
            ],
            "witness_count": len(witnesses),
            "witness_summary": f"{len(witnesses)} witnesses listed"
        }
    
    def _summarize_facts(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize case facts"""
        fir = case_data.get("fir_details", {})
        
        incident_details = fir.get("incident_details", "")
        
        # Extract key facts
        facts = {
            "incident_date": fir.get("incident_date", "Not specified"),
            "incident_place": fir.get("incident_place", "Not specified"),
            "incident_time": fir.get("incident_time", "Not specified"),
            "brief_narrative": incident_details[:500] if incident_details else "No details available",
            "alleged_offense": self._extract_offense_description(incident_details)
        }
        
        return facts
    
    def _extract_offense_description(self, incident_details: str) -> str:
        """Extract brief offense description from incident details"""
        if not incident_details:
            return "Not specified"
        
        # Take first 2-3 sentences
        sentences = incident_details.split('.')[:3]
        return '. '.join(sentences).strip() + '.'
    
    def _analyze_charges(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze charges and sections"""
        charges = case_data.get("charges", [])
        
        if not charges:
            return {
                "total_charges": 0,
                "sections": [],
                "severity": "UNKNOWN",
                "bailable": "UNKNOWN"
            }
        
        # Categorize charges
        cognizable = []
        non_cognizable = []
        bailable = []
        non_bailable = []
        
        for charge in charges:
            section = charge.get("section", "")
            
            if charge.get("cognizable"):
                cognizable.append(section)
            else:
                non_cognizable.append(section)
            
            if charge.get("bailable"):
                bailable.append(section)
            else:
                non_bailable.append(section)
        
        # Determine overall severity
        severity = "SEVERE" if non_bailable else "MODERATE" if cognizable else "MINOR"
        
        return {
            "total_charges": len(charges),
            "sections": [c.get("section", "Unknown") for c in charges],
            "severity": severity,
            "cognizable_sections": cognizable,
            "non_cognizable_sections": non_cognizable,
            "bailable_sections": bailable,
            "non_bailable_sections": non_bailable,
            "overall_bailable": len(non_bailable) == 0
        }
    
    def _summarize_evidence(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize evidence submitted"""
        evidence = case_data.get("evidence", [])
        documents = case_data.get("documents", [])
        
        # Categorize evidence
        evidence_by_type = {
            "PHYSICAL": [],
            "DOCUMENTARY": [],
            "DIGITAL": [],
            "FORENSIC": [],
            "TESTIMONIAL": []
        }
        
        for ev in evidence:
            ev_type = ev.get("type", "PHYSICAL")
            evidence_by_type[ev_type].append(ev.get("description", ""))
        
        # Document types
        doc_types = {}
        for doc in documents:
            doc_type = doc.get("type", "OTHER")
            doc_types[doc_type] = doc_types.get(doc_type, 0) + 1
        
        return {
            "total_evidence_items": len(evidence),
            "evidence_by_type": {k: len(v) for k, v in evidence_by_type.items() if v},
            "key_evidence": evidence[:5] if evidence else [],
            "documents_submitted": doc_types,
            "total_documents": len(documents),
            "evidence_strength": self._assess_evidence_strength(evidence, documents)
        }
    
    def _assess_evidence_strength(self, evidence: List[Dict], documents: List[Dict]) -> str:
        """Assess overall evidence strength"""
        score = 0
        
        # Evidence count
        if len(evidence) >= 5:
            score += 3
        elif len(evidence) >= 3:
            score += 2
        elif len(evidence) >= 1:
            score += 1
        
        # Document count
        if len(documents) >= 10:
            score += 3
        elif len(documents) >= 5:
            score += 2
        elif len(documents) >= 3:
            score += 1
        
        # Forensic evidence
        has_forensic = any(e.get("type") == "FORENSIC" for e in evidence)
        if has_forensic:
            score += 2
        
        # Categorize strength
        if score >= 7:
            return "STRONG"
        elif score >= 4:
            return "MODERATE"
        else:
            return "WEAK"
    
    def _identify_legal_issues(self, case_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Identify key legal issues in the case"""
        issues = []
        
        charges = case_data.get("charges", [])
        evidence = case_data.get("evidence", [])
        defense_summary = case_data.get("defense_summary", "")
        
        # Issue 1: Sufficiency of evidence
        if len(evidence) < 3:
            issues.append({
                "issue": "Sufficiency of Evidence",
                "description": "Limited evidence items may affect prosecution case",
                "priority": "HIGH"
            })
        
        # Issue 2: Multiple charges coordination
        if len(charges) > 3:
            issues.append({
                "issue": "Multiple Charges",
                "description": f"{len(charges)} charges filed - consider consolidation",
                "priority": "MEDIUM"
            })
        
        # Issue 3: Bail considerations
        bailable_count = sum(1 for c in charges if c.get("bailable"))
        if bailable_count > 0 and len(charges) > bailable_count:
            issues.append({
                "issue": "Bail Eligibility",
                "description": "Mix of bailable and non-bailable offenses",
                "priority": "HIGH"
            })
        
        # Issue 4: Defense contentions
        if "alibi" in defense_summary.lower():
            issues.append({
                "issue": "Alibi Defense",
                "description": "Defense claims alibi - verify timeline",
                "priority": "HIGH"
            })
        
        return issues if issues else [{"issue": "Standard Trial", "description": "No exceptional legal issues identified", "priority": "LOW"}]
    
    def _suggest_precedents(self, case_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Suggest relevant precedents (placeholder)"""
        case_type = case_data.get("case_type", "GENERAL")
        charges = case_data.get("charges", [])
        
        # This would integrate with precedent matcher in production
        precedents = [
            {
                "title": f"Relevant precedent for {case_type} cases",
                "citation": "Will be fetched from precedent database",
                "relevance": "To be determined by precedent matcher"
            }
        ]
        
        return precedents
    
    def _summarize_prosecution(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize prosecution case"""
        prosecution = case_data.get("prosecution_summary", "")
        
        return {
            "summary": prosecution[:300] if prosecution else "Prosecution summary not available",
            "key_points": self._extract_key_points(prosecution) if prosecution else [],
            "strength": "To be assessed based on evidence and arguments"
        }
    
    def _summarize_defense(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize defense case"""
        defense = case_data.get("defense_summary", "")
        
        return {
            "summary": defense[:300] if defense else "Defense summary not available",
            "key_points": self._extract_key_points(defense) if defense else [],
            "strategy": self._identify_defense_strategy(defense) if defense else "Not specified"
        }
    
    def _extract_key_points(self, text: str) -> List[str]:
        """Extract key points from text (simple sentence splitting)"""
        if not text:
            return []
        
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        return sentences[:5]  # Top 5 sentences
    
    def _identify_defense_strategy(self, defense_text: str) -> str:
        """Identify defense strategy from text"""
        defense_lower = defense_text.lower()
        
        if "alibi" in defense_lower:
            return "Alibi Defense"
        elif "self-defense" in defense_lower or "self defense" in defense_lower:
            return "Self-Defense"
        elif "false" in defense_lower or "fabricated" in defense_lower:
            return "False Accusation"
        elif "innocent" in defense_lower:
            return "Denial/Innocence"
        else:
            return "General Defense"
    
    def _generate_considerations(self, case_data: Dict[str, Any]) -> List[str]:
        """Generate key considerations for the judge"""
        considerations = []
        
        charges = case_data.get("charges", [])
        evidence = case_data.get("evidence", [])
        witnesses = case_data.get("witnesses", [])
        accused = case_data.get("accused", [])
        
        # Evidence consideration
        if len(evidence) < 5:
            considerations.append("Limited evidence - assess credibility and sufficiency carefully")
        
        # Witness consideration
        if len(witnesses) < 2:
            considerations.append("Limited witnesses - consider corroboration requirements")
        
        # Multiple accused
        if len(accused) > 1:
            considerations.append("Multiple accused - assess individual culpability separately")
        
        # Severity of charges
        non_bailable = [c for c in charges if not c.get("bailable")]
        if non_bailable:
            considerations.append(f"{len(non_bailable)} non-bailable offense(s) - bail consideration requires careful scrutiny")
        
        # Custody status
        in_custody = [a for a in accused if a.get("custody_status") == "IN_CUSTODY"]
        if in_custody:
            considerations.append(f"{len(in_custody)} accused in custody - expedite proceedings")
        
        return considerations if considerations else ["Standard case proceedings apply"]
    
    def _generate_timeline(self, case_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate case timeline"""
        timeline_events = case_data.get("timeline", [])
        fir = case_data.get("fir_details", {})
        
        # Create timeline
        timeline = []
        
        # Add FIR registration
        if fir.get("date"):
            timeline.append({
                "date": fir.get("date"),
                "event": "FIR Registered",
                "description": f"FIR No. {fir.get('fir_number', 'N/A')}"
            })
        
        # Add other timeline events
        for event in timeline_events:
            timeline.append({
                "date": event.get("date", "Unknown"),
                "event": event.get("event_type", "Event"),
                "description": event.get("description", "")
            })
        
        # Sort by date (simplified)
        return sorted(timeline, key=lambda x: x.get("date", ""), reverse=True)[:10]
    
    def _check_procedural_compliance(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check procedural compliance"""
        documents = case_data.get("documents", [])
        
        required_docs = ["FIR", "CHARGESHEET"]
        present_docs = [d.get("type") for d in documents]
        
        missing = [doc for doc in required_docs if doc not in present_docs]
        
        return {
            "compliant": len(missing) == 0,
            "missing_documents": missing,
            "status": "COMPLIANT" if not missing else "INCOMPLETE",
            "remarks": "All required documents present" if not missing else f"Missing: {', '.join(missing)}"
        }
    
    def _identify_attention_areas(self, case_data: Dict[str, Any]) -> List[str]:
        """Identify areas requiring judicial attention"""
        areas = []
        
        evidence = case_data.get("evidence", [])
        witnesses = case_data.get("witnesses", [])
        charges = case_data.get("charges", [])
        
        if len(evidence) == 0:
            areas.append("No evidence items recorded - verify prosecution case")
        
        if len(witnesses) == 0:
            areas.append("No witnesses listed - confirm witness examination status")
        
        if len(charges) == 0:
            areas.append("No charges specified - verify chargesheet")
        
        # Check for conflicting information
        accused = case_data.get("accused", [])
        in_custody = sum(1 for a in accused if a.get("custody_status") == "IN_CUSTODY")
        on_bail = sum(1 for a in accused if a.get("bail_status") == "GRANTED")
        
        if in_custody > 0 and on_bail > 0:
            areas.append("Mixed custody status among accused - verify individual bail status")
        
        return areas if areas else ["No critical areas requiring immediate attention"]


# Singleton instance
_brief_generator = None


def get_brief_generator() -> CaseBriefGenerator:
    """Get or create the case brief generator instance"""
    global _brief_generator
    if _brief_generator is None:
        _brief_generator = CaseBriefGenerator()
    return _brief_generator

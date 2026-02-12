"""
Document Validator - Validates legal documents for court submission (Clerk feature)
Checks format, required fields, signatures, and legal compliance
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import re
from .logger import get_logger

logger = get_logger(__name__)


class DocumentValidator:
    """Validate legal documents for court submission"""
    
    # Document type requirements
    DOCUMENT_REQUIREMENTS = {
        "CHARGESHEET": {
            "required_fields": ["case_number", "accused_name", "sections", "investigating_officer", "date"],
            "required_signatures": ["IO", "SHO"],
            "min_pages": 3,
            "must_contain": ["offence", "evidence", "witness"]
        },
        "FIR": {
            "required_fields": ["fir_number", "date", "complainant", "accused", "incident_details"],
            "required_signatures": ["COMPLAINANT", "OFFICER"],
            "min_pages": 1,
            "must_contain": ["incident", "date", "place"]
        },
        "WITNESS_STATEMENT": {
            "required_fields": ["statement_number", "witness_name", "date", "statement_text"],
            "required_signatures": ["WITNESS", "MAGISTRATE"],
            "min_pages": 1,
            "must_contain": ["witnessed", "oath"]
        },
        "MEDICAL_REPORT": {
            "required_fields": ["report_number", "patient_name", "examination_date", "doctor_name", "findings"],
            "required_signatures": ["DOCTOR"],
            "min_pages": 1,
            "must_contain": ["examination", "injuries", "opinion"]
        },
        "FORENSIC_REPORT": {
            "required_fields": ["report_number", "case_reference", "analysis_date", "examiner_name", "findings"],
            "required_signatures": ["FORENSIC_EXPERT"],
            "min_pages": 2,
            "must_contain": ["analysis", "conclusion", "method"]
        },
        "BAIL_APPLICATION": {
            "required_fields": ["application_number", "accused_name", "case_reference", "grounds"],
            "required_signatures": ["APPLICANT", "ADVOCATE"],
            "min_pages": 2,
            "must_contain": ["bail", "grounds", "surety"]
        },
        "PETITION": {
            "required_fields": ["petition_number", "petitioner_name", "case_reference", "prayer"],
            "required_signatures": ["PETITIONER", "ADVOCATE"],
            "min_pages": 2,
            "must_contain": ["facts", "prayer", "verification"]
        }
    }
    
    # Field patterns for validation
    FIELD_PATTERNS = {
        "case_number": r"(?:case|fir|cr)\s*(?:no|number|#)\s*:?\s*(\d{1,6}(?:/\d{4})?)",
        "fir_number": r"fir\s*(?:no|number|#)\s*:?\s*(\d{1,6}(?:/\d{4})?)",
        "date": r"\b(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2})\b",
        "section": r"(?:section|sec)\s*(\d{1,4}[A-Z]?(?:\([a-z0-9]\))?)",
        "signature": r"(?:signature|signed|sd/-)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
    }
    
    def __init__(self):
        logger.info("Document Validator initialized")
    
    def validate_document(
        self,
        document_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate a legal document for court submission
        
        Args:
            document_data: Dictionary containing document information
                - document_type: Type of document (CHARGESHEET, FIR, etc.)
                - content: Document text content
                - metadata: Additional metadata (pages, signatures, etc.)
                - fields: Extracted fields from document
        
        Returns:
            Validation result with errors, warnings, and compliance score
        """
        logger.info("Validating document", doc_type=document_data.get("document_type"))
        
        doc_type = document_data.get("document_type", "").upper()
        content = document_data.get("content", "")
        metadata = document_data.get("metadata", {})
        fields = document_data.get("fields", {})
        
        # Get requirements for this document type
        requirements = self.DOCUMENT_REQUIREMENTS.get(doc_type)
        
        if not requirements:
            logger.warning("Unknown document type", doc_type=doc_type)
            return {
                "valid": False,
                "document_type": doc_type,
                "errors": [f"Unknown document type: {doc_type}"],
                "warnings": [],
                "compliance_score": 0,
                "validated_at": datetime.utcnow().isoformat() + "Z"
            }
        
        errors = []
        warnings = []
        
        # 1. Check required fields
        missing_fields = []
        present_fields = []
        for required_field in requirements["required_fields"]:
            if required_field in fields and fields[required_field]:
                present_fields.append(required_field)
            else:
                # Try to extract from content
                extracted = self._extract_field(content, required_field)
                if extracted:
                    present_fields.append(required_field)
                    warnings.append(f"Field '{required_field}' found in content but not in structured data")
                else:
                    missing_fields.append(required_field)
        
        if missing_fields:
            errors.append(f"Missing required fields: {', '.join(missing_fields)}")
        
        # 2. Check signatures
        required_signatures = requirements["required_signatures"]
        provided_signatures = metadata.get("signatures", [])
        missing_signatures = []
        for sig in required_signatures:
            if sig not in provided_signatures:
                # Check in content
                if not self._check_signature_in_content(content, sig):
                    missing_signatures.append(sig)
        
        if missing_signatures:
            errors.append(f"Missing required signatures: {', '.join(missing_signatures)}")
        
        # 3. Check page count
        page_count = metadata.get("pages", 0)
        min_pages = requirements["min_pages"]
        if page_count < min_pages:
            warnings.append(f"Document has {page_count} page(s), expected at least {min_pages}")
        
        # 4. Check required content
        missing_content = []
        for required_term in requirements["must_contain"]:
            if not self._check_content_presence(content, required_term):
                missing_content.append(required_term)
        
        if missing_content:
            warnings.append(f"Document may be incomplete - missing content related to: {', '.join(missing_content)}")
        
        # 5. Check formatting issues
        format_issues = self._check_formatting(content, doc_type)
        if format_issues:
            warnings.extend(format_issues)
        
        # 6. Check legal compliance
        compliance_issues = self._check_legal_compliance(content, doc_type, fields)
        if compliance_issues:
            warnings.extend(compliance_issues)
        
        # Calculate compliance score (0-100)
        compliance_score = self._calculate_compliance_score(
            len(missing_fields),
            len(requirements["required_fields"]),
            len(missing_signatures),
            len(required_signatures),
            page_count,
            min_pages,
            len(missing_content),
            len(requirements["must_contain"]),
            len(errors),
            len(warnings)
        )
        
        # Determine overall validity
        is_valid = len(errors) == 0 and compliance_score >= 70
        
        result = {
            "valid": is_valid,
            "document_type": doc_type,
            "compliance_score": round(compliance_score, 1),
            "status": "APPROVED" if is_valid else "REJECTED" if errors else "NEEDS_REVIEW",
            "field_analysis": {
                "required": requirements["required_fields"],
                "present": present_fields,
                "missing": missing_fields
            },
            "signature_analysis": {
                "required": required_signatures,
                "present": provided_signatures,
                "missing": missing_signatures
            },
            "content_analysis": {
                "page_count": page_count,
                "min_required": min_pages,
                "missing_content": missing_content
            },
            "errors": errors,
            "warnings": warnings,
            "recommendations": self._generate_recommendations(errors, warnings, missing_fields, missing_signatures),
            "validated_at": datetime.utcnow().isoformat() + "Z"
        }
        
        logger.info(
            "Document validation complete",
            doc_type=doc_type,
            valid=is_valid,
            score=compliance_score,
            errors=len(errors),
            warnings=len(warnings)
        )
        
        return result
    
    def _extract_field(self, content: str, field_name: str) -> Optional[str]:
        """Try to extract a field from content using patterns"""
        pattern = self.FIELD_PATTERNS.get(field_name)
        if not pattern:
            return None
        
        match = re.search(pattern, content, re.IGNORECASE)
        return match.group(1) if match else None
    
    def _check_signature_in_content(self, content: str, signature_type: str) -> bool:
        """Check if a signature is present in content"""
        signature_keywords = {
            "IO": ["investigating officer", "i.o.", "io signature"],
            "SHO": ["station house officer", "s.h.o.", "sho signature"],
            "COMPLAINANT": ["complainant signature", "signed complainant"],
            "OFFICER": ["officer signature", "signed officer"],
            "WITNESS": ["witness signature", "signed witness"],
            "MAGISTRATE": ["magistrate signature", "before magistrate"],
            "DOCTOR": ["doctor signature", "medical officer"],
            "FORENSIC_EXPERT": ["forensic expert", "examiner signature"],
            "APPLICANT": ["applicant signature", "signed applicant"],
            "ADVOCATE": ["advocate signature", "counsel signature"],
            "PETITIONER": ["petitioner signature", "signed petitioner"]
        }
        
        keywords = signature_keywords.get(signature_type, [signature_type.lower()])
        return any(keyword in content.lower() for keyword in keywords)
    
    def _check_content_presence(self, content: str, term: str) -> bool:
        """Check if required content term is present"""
        return term.lower() in content.lower()
    
    def _check_formatting(self, content: str, doc_type: str) -> List[str]:
        """Check for formatting issues"""
        issues = []
        
        # Check for very short content
        if len(content.strip()) < 100:
            issues.append("Document content is very short")
        
        # Check for excessive whitespace
        if content.count('\n\n\n') > 5:
            issues.append("Document has excessive blank lines")
        
        # Check for missing punctuation at sentence ends
        sentences = re.split(r'[.!?]', content)
        if len(sentences) > 10 and len([s for s in sentences if s.strip()]) < 5:
            issues.append("Document may have punctuation issues")
        
        return issues
    
    def _check_legal_compliance(
        self,
        content: str,
        doc_type: str,
        fields: Dict[str, Any]
    ) -> List[str]:
        """Check for legal compliance issues"""
        issues = []
        
        # Check for IPC/BNS sections in chargesheet
        if doc_type == "CHARGESHEET":
            section_pattern = r"(?:IPC|BNS)\s*\d{1,4}"
            sections = re.findall(section_pattern, content, re.IGNORECASE)
            if not sections:
                issues.append("No IPC/BNS sections found in chargesheet")
        
        # Check for date format consistency
        dates = re.findall(self.FIELD_PATTERNS["date"], content)
        if len(set(dates)) > 3 and len(dates) > 5:
            issues.append("Multiple different date formats used - standardize format")
        
        # Check for verification clause in petitions
        if doc_type == "PETITION":
            if "verification" not in content.lower():
                issues.append("Petition missing verification clause")
        
        # Check for medical opinion in medical reports
        if doc_type == "MEDICAL_REPORT":
            if not any(term in content.lower() for term in ["opinion", "conclusion", "diagnosis"]):
                issues.append("Medical report should include doctor's opinion/conclusion")
        
        return issues
    
    def _calculate_compliance_score(
        self,
        missing_fields_count: int,
        total_fields: int,
        missing_sig_count: int,
        total_sigs: int,
        page_count: int,
        min_pages: int,
        missing_content_count: int,
        total_content_checks: int,
        error_count: int,
        warning_count: int
    ) -> float:
        """Calculate overall compliance score (0-100)"""
        
        # Field completeness: 35% weight
        field_score = ((total_fields - missing_fields_count) / total_fields) * 35 if total_fields > 0 else 0
        
        # Signature completeness: 30% weight
        sig_score = ((total_sigs - missing_sig_count) / total_sigs) * 30 if total_sigs > 0 else 0
        
        # Page adequacy: 10% weight
        page_score = min(page_count / min_pages, 1.0) * 10 if min_pages > 0 else 10
        
        # Content completeness: 15% weight
        content_score = ((total_content_checks - missing_content_count) / total_content_checks) * 15 if total_content_checks > 0 else 0
        
        # Error/warning penalty: 10% weight
        penalty = min(error_count * 5 + warning_count * 2, 10)
        quality_score = max(10 - penalty, 0)
        
        total_score = field_score + sig_score + page_score + content_score + quality_score
        
        return min(total_score, 100)
    
    def _generate_recommendations(
        self,
        errors: List[str],
        warnings: List[str],
        missing_fields: List[str],
        missing_signatures: List[str]
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if missing_fields:
            recommendations.append(f"Add missing fields: {', '.join(missing_fields[:3])}")
        
        if missing_signatures:
            recommendations.append(f"Obtain required signatures: {', '.join(missing_signatures)}")
        
        if errors:
            recommendations.append("Fix all errors before resubmission")
        
        if warnings and len(warnings) > 2:
            recommendations.append("Address warnings to improve document quality")
        
        if not errors and not warnings:
            recommendations.append("Document is ready for court submission")
        
        return recommendations


# Singleton instance
_document_validator = None


def get_document_validator() -> DocumentValidator:
    """Get or create the document validator instance"""
    global _document_validator
    if _document_validator is None:
        _document_validator = DocumentValidator()
    return _document_validator

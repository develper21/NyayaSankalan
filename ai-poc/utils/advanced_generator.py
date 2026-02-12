"""
Advanced Document Generator
Template-based generation with section suggestions and precedent integration
"""
import json
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape


class AdvancedDocumentGenerator:
    """Generate legal documents using templates and AI assistance"""
    
    def __init__(self):
        self.templates_dir = Path(__file__).parent.parent / "templates" / "legal_templates"
        self.env = self._setup_jinja_env()
        self.section_suggester = None
        self._load_section_suggester()
    
    def _setup_jinja_env(self) -> Environment:
        """Setup Jinja2 environment"""
        try:
            env = Environment(
                loader=FileSystemLoader(str(self.templates_dir)),
                autoescape=select_autoescape(['html', 'xml']),
                trim_blocks=True,
                lstrip_blocks=True
            )
            return env
        except Exception as e:
            print(f"Warning: Could not setup Jinja environment: {e}")
            return None
    
    def _load_section_suggester(self):
        """Load section suggester for intelligent section recommendations"""
        try:
            from .section_suggester import get_section_suggester
            self.section_suggester = get_section_suggester()
        except:
            print("Warning: Section suggester not available")
    
    def generate_charge_sheet(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate charge sheet from case data
        
        Args:
            case_data: Dictionary containing case information
        
        Returns:
            Generated document text and metadata
        """
        if not self.env:
            return {"error": "Template engine not initialized"}
        
        try:
            # Get suggested sections if not provided
            if "sections" not in case_data or not case_data["sections"]:
                if self.section_suggester and "case_facts" in case_data:
                    suggestions = self.section_suggester.suggest_sections(
                        case_data["case_facts"],
                        top_k=3
                    )
                    
                    # Format sections
                    sections = [s["section"] for s in suggestions["suggestions"]]
                    case_data["sections"] = ", ".join(sections)
                    case_data["section_justification"] = self._format_section_justification(
                        suggestions["suggestions"]
                    )
            
            # Add current date if not provided
            if "date" not in case_data:
                case_data["date"] = datetime.now().strftime("%Y-%m-%d")
            
            # Load and render template
            template = self.env.get_template("charge_sheet.jinja2")
            document_text = template.render(**case_data)
            
            return {
                "document_type": "charge_sheet",
                "text": document_text,
                "metadata": {
                    "fir_number": case_data.get("fir_number"),
                    "sections": case_data.get("sections"),
                    "generated_at": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            return {"error": f"Failed to generate charge sheet: {str(e)}"}
    
    def generate_evidence_list(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate evidence list document"""
        if not self.env:
            return {"error": "Template engine not initialized"}
        
        try:
            if "date" not in case_data:
                case_data["date"] = datetime.now().strftime("%Y-%m-%d")
            
            template = self.env.get_template("evidence_list.jinja2")
            document_text = template.render(**case_data)
            
            return {
                "document_type": "evidence_list",
                "text": document_text,
                "metadata": {
                    "case_number": case_data.get("case_number"),
                    "evidence_count": len(case_data.get("evidence_items", [])),
                    "generated_at": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            return {"error": f"Failed to generate evidence list: {str(e)}"}
    
    def generate_witness_list(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate witness list document"""
        if not self.env:
            return {"error": "Template engine not initialized"}
        
        try:
            if "date" not in case_data:
                case_data["date"] = datetime.now().strftime("%Y-%m-%d")
            
            # Calculate witness counts by type
            witnesses = case_data.get("witnesses", [])
            eye_witness_count = sum(1 for w in witnesses if w.get("type") == "Eye Witness")
            expert_witness_count = sum(1 for w in witnesses if w.get("type") == "Expert Witness")
            character_witness_count = sum(1 for w in witnesses if w.get("type") == "Character Witness")
            
            case_data.update({
                "eye_witness_count": eye_witness_count,
                "expert_witness_count": expert_witness_count,
                "character_witness_count": character_witness_count
            })
            
            template = self.env.get_template("witness_list.jinja2")
            document_text = template.render(**case_data)
            
            return {
                "document_type": "witness_list",
                "text": document_text,
                "metadata": {
                    "case_number": case_data.get("case_number"),
                    "witness_count": len(witnesses),
                    "generated_at": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            return {"error": f"Failed to generate witness list: {str(e)}"}
    
    def generate_document(
        self,
        document_type: str,
        case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate any supported document type
        
        Args:
            document_type: Type of document (charge_sheet, evidence_list, witness_list)
            case_data: Case data dictionary
        
        Returns:
            Generated document
        """
        generators = {
            "charge_sheet": self.generate_charge_sheet,
            "evidence_list": self.generate_evidence_list,
            "witness_list": self.generate_witness_list
        }
        
        generator = generators.get(document_type)
        if not generator:
            return {
                "error": f"Unsupported document type: {document_type}",
                "supported_types": list(generators.keys())
            }
        
        return generator(case_data)
    
    def _format_section_justification(self, suggestions: list) -> str:
        """Format section suggestions into justification text"""
        if not suggestions:
            return ""
        
        justification = "\n   Justification:\n"
        for sugg in suggestions:
            justification += f"   - {sugg['section']}: {sugg['title']} (Confidence: {sugg['confidence']})\n"
        
        return justification
    
    def get_available_templates(self) -> list:
        """Get list of available document templates"""
        try:
            templates = []
            for file in self.templates_dir.glob("*.jinja2"):
                templates.append(file.stem)
            return templates
        except:
            return []


# Singleton instance
_advanced_generator_instance = None

def get_advanced_generator() -> AdvancedDocumentGenerator:
    """Get or create Advanced Document Generator instance"""
    global _advanced_generator_instance
    if _advanced_generator_instance is None:
        _advanced_generator_instance = AdvancedDocumentGenerator()
    return _advanced_generator_instance

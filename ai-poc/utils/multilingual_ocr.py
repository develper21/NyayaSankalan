"""
Multilingual OCR Support
Supports English, Hindi, and other Indian regional languages
"""
import os
from typing import Dict, Any, Optional, List
from PIL import Image
import pytesseract
from pathlib import Path

# Language detection
try:
    from langdetect import detect, DetectorFactory
    DetectorFactory.seed = 0  # For consistent results
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    print("Warning: langdetect not installed. Language detection disabled.")


# Tesseract language codes mapping
LANGUAGE_CODES = {
    "eng": "English",
    "hin": "Hindi",
    "ben": "Bengali",
    "tam": "Tamil",
    "tel": "Telugu",
    "mar": "Marathi",
    "guj": "Gujarati",
    "kan": "Kannada",
    "mal": "Malayalam",
    "pan": "Punjabi",
    "urd": "Urdu",
    "ori": "Odia"
}

# Common language combinations
LANGUAGE_COMBINATIONS = {
    "english_hindi": "eng+hin",
    "english_bengali": "eng+ben",
    "english_tamil": "eng+tam",
    "english_telugu": "eng+tel",
    "english_marathi": "eng+mar"
}


class MultilingualOCR:
    """Enhanced OCR with multilingual support"""
    
    def __init__(self):
        self.available_languages = self._check_available_languages()
    
    def _check_available_languages(self) -> List[str]:
        """Check which Tesseract languages are installed"""
        try:
            langs = pytesseract.get_languages()
            return langs
        except Exception as e:
            print(f"Warning: Could not get Tesseract languages: {e}")
            return ["eng"]  # Default to English
    
    def detect_language(self, image_path: str) -> Optional[str]:
        """
        Detect the language of text in image using OSD (Orientation and Script Detection)
        
        Returns:
            Language code (e.g., 'hin', 'eng') or None
        """
        try:
            # First, try script detection
            osd = pytesseract.image_to_osd(image_path)
            
            # Parse script from OSD output
            script_match = None
            for line in osd.split('\n'):
                if 'Script:' in line:
                    script_match = line.split(':')[1].strip()
                    break
            
            # Map script to language
            script_to_lang = {
                'Devanagari': 'hin',
                'Bengali': 'ben',
                'Tamil': 'tam',
                'Telugu': 'tel',
                'Gujarati': 'guj',
                'Kannada': 'kan',
                'Malayalam': 'mal',
                'Gurmukhi': 'pan',
                'Latin': 'eng'
            }
            
            if script_match in script_to_lang:
                return script_to_lang[script_match]
            
            return 'eng'  # Default to English
            
        except Exception as e:
            print(f"Script detection failed: {e}")
            return None
    
    def detect_text_language(self, text: str) -> Optional[str]:
        """
        Detect language from extracted text using langdetect
        
        Returns:
            ISO language code (e.g., 'hi', 'en') or None
        """
        if not LANGDETECT_AVAILABLE:
            return None
        
        try:
            if len(text.strip()) < 10:
                return None
            
            lang_code = detect(text)
            
            # Map ISO codes to Tesseract codes
            iso_to_tesseract = {
                'en': 'eng',
                'hi': 'hin',
                'bn': 'ben',
                'ta': 'tam',
                'te': 'tel',
                'mr': 'mar',
                'gu': 'guj',
                'kn': 'kan',
                'ml': 'mal',
                'pa': 'pan',
                'ur': 'urd'
            }
            
            return iso_to_tesseract.get(lang_code, 'eng')
            
        except Exception as e:
            print(f"Text language detection failed: {e}")
            return None
    
    def extract_text(
        self,
        image_path: str,
        language: Optional[str] = None,
        auto_detect: bool = True
    ) -> Dict[str, Any]:
        """
        Extract text from image with multilingual support
        
        Args:
            image_path: Path to image file
            language: Tesseract language code (e.g., 'eng', 'hin', 'eng+hin')
            auto_detect: Automatically detect language if True
        
        Returns:
            Dictionary with extracted text and metadata
        """
        try:
            # Load image
            image = Image.open(image_path)
            
            # Auto-detect language if requested
            detected_lang = None
            if auto_detect and language is None:
                detected_lang = self.detect_language(image_path)
                if detected_lang:
                    language = detected_lang
            
            # Default to English if no language specified
            if language is None:
                language = 'eng'
            
            # Check if language is available
            if language not in self.available_languages:
                # Try with English + detected language
                if '+' not in language and 'eng' in self.available_languages:
                    language = f'eng+{language}'
                else:
                    print(f"Warning: Language '{language}' not available. Using English.")
                    language = 'eng'
            
            # Perform OCR
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(
                image,
                lang=language,
                config=custom_config
            )
            
            # Get detailed data
            data = pytesseract.image_to_data(
                image,
                lang=language,
                output_type=pytesseract.Output.DICT
            )
            
            # Calculate confidence
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Detect text language if possible
            text_language = None
            if LANGDETECT_AVAILABLE:
                text_language = self.detect_text_language(text)
            
            return {
                "text": text.strip(),
                "language_used": language,
                "detected_script": detected_lang,
                "detected_text_language": text_language,
                "confidence": round(avg_confidence, 2),
                "available_languages": self.available_languages,
                "word_count": len(text.split()),
                "char_count": len(text)
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "text": "",
                "confidence": 0
            }
    
    def extract_text_multilingual(
        self,
        image_path: str,
        languages: List[str]
    ) -> Dict[str, Any]:
        """
        Try OCR with multiple languages and return best result
        
        Args:
            image_path: Path to image file
            languages: List of language codes to try
        
        Returns:
            Best OCR result based on confidence
        """
        results = []
        
        for lang in languages:
            result = self.extract_text(image_path, language=lang, auto_detect=False)
            if "error" not in result:
                results.append(result)
        
        # Return result with highest confidence
        if results:
            best_result = max(results, key=lambda x: x.get("confidence", 0))
            best_result["all_attempts"] = len(results)
            return best_result
        
        return {
            "error": "All OCR attempts failed",
            "text": "",
            "confidence": 0
        }
    
    def process_bilingual_document(
        self,
        image_path: str,
        primary_lang: str = "eng",
        secondary_lang: str = "hin"
    ) -> Dict[str, Any]:
        """
        Process document that contains text in two languages
        
        Common for Indian legal documents (English + Hindi/Regional)
        
        Returns:
            OCR result with combined language support
        """
        combined_lang = f"{primary_lang}+{secondary_lang}"
        return self.extract_text(image_path, language=combined_lang, auto_detect=False)


# Singleton instance
_multilingual_ocr_instance = None

def get_multilingual_ocr() -> MultilingualOCR:
    """Get or create Multilingual OCR instance"""
    global _multilingual_ocr_instance
    if _multilingual_ocr_instance is None:
        _multilingual_ocr_instance = MultilingualOCR()
    return _multilingual_ocr_instance

from PIL import Image
import pytesseract
import io
import pdfplumber


def image_to_text(file_bytes: bytes) -> str:
    """Run OCR on image bytes or extract text from a PDF. Returns extracted text."""
    # Try image OCR first
    try:
        img = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(img)
        if text and text.strip():
            return text
    except Exception:
        pass

    # Try PDF text extraction
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages = [p.extract_text() or "" for p in pdf.pages]
            text = "\n".join(pages)
            if text.strip():
                return text
    except Exception:
        pass

    # Fallback: try plain text decode
    try:
        return file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return ""


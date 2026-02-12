from utils.ocr import image_to_text
from utils.ner import extract_entities

sample_text = "Complainant: John Doe\nIncident Date: 2025-12-01\nSections: IPC 302\nContact: 9876543210\nDescription: Test incident"

print('Running sanity checks...')

print('\nNER extraction:')
print(extract_entities(sample_text))

print('\nOCR (text fallback):')
print(image_to_text(sample_text.encode('utf-8')))

print('\nAttempting draft generation:')
from utils.generator import generate_draft_from_text
print(generate_draft_from_text(sample_text))

print('\nAll good (if outputs shown).')

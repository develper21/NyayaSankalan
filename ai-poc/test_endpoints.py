from fastapi.testclient import TestClient
import io
import json

import importlib.util, sys
spec=importlib.util.spec_from_file_location('main','d:\\Mohil\\-NyayaSankalan---CMS-main\\-NyayaSankalan---CMS\\ai-poc\\main.py')
main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(main)

client = TestClient(main.app)

# Test OCR extract with a text file as fallback
sample_text = 'Complainant: John Doe\nIncident Date: 2025-12-01\nSections: IPC 302\nContact: 9876543210\nDescription: Test incident'
file_bytes = sample_text.encode('utf-8')
files = {'file': ('sample.txt', io.BytesIO(file_bytes), 'text/plain')}
resp = client.post('/ocr-extract', files=files, data={'caseId': 'CASE-123'})
print('OCR Extract status:', resp.status_code)
print(resp.json())
extraction_id = None
if resp.status_code == 200 and resp.json().get('success'):
    extraction_id = resp.json()['data']['extractionId']

# Test generate draft from extraction
if extraction_id:
    resp2 = client.post('/generate-draft', data={'extractionId': extraction_id})
else:
    resp2 = client.post('/generate-draft', data={'text': sample_text})

print('Generate Draft status:', resp2.status_code)
print(json.dumps(resp2.json(), indent=2))

# Try to retrieve draft if available
doc_id = resp2.json().get('data', {}).get('documentId')
if doc_id:
    r3 = client.get(f'/drafts/{doc_id}')
    print('Get Draft:', r3.status_code, r3.json())
else:
    print('No documentId returned from generate-draft.')


# Rebuild FAISS index from available extractions
print('\n--- Rebuilding FAISS index ---')
r_index = client.post('/index')
print('Index rebuild status:', r_index.status_code)
print(r_index.json())

# Run single-doc index endpoint
if extraction_id:
    print('\n--- Index single document ---')
    r_single = client.post(f'/index/doc/{extraction_id}')
    print('Index single status:', r_single.status_code)
    print(r_single.json())

# Run search
print('\n--- Running semantic search ---')
resp_search = client.get('/search', params={'q': 'John Doe incident', 'k': 3})
print('Search status:', resp_search.status_code)
print(json.dumps(resp_search.json(), indent=2))

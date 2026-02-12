import requests
import json

BASE_URL = "http://localhost:8001"

print("\n" + "="*70)
print("  🧪 AI FEATURES LIVE DEMO - Interactive Testing")
print("="*70)

# Test 1: Legal NER
print("\n✅ TEST 1: Legal NER - Extract Legal Entities from Text")
print("-" * 70)
text = "The accused was charged under Section 302 IPC and Section 307 IPC. The case was filed in Delhi High Court and Supreme Court."
print(f"Input Text:\n  {text}\n")

response = requests.post(f"{BASE_URL}/api/ai/legal-ner", data={"text": text})
print(f"Response Status: {response.status_code}")
print(f"Raw Response: {response.text[:200]}")

result = response.json()
if result.get('success'):
    data = result.get('data', {})
    print(f"\n📋 Extracted Legal Entities:")
    print(f"  • IPC Sections: {data.get('ipc_sections', [])}")
    print(f"  • BNS Sections: {data.get('bns_sections', [])}")
    print(f"  • Court Names: {data.get('court_names', [])}")
    print(f"  • Case Citations: {data.get('case_citations', [])}")
    print(f"  • Persons: {data.get('persons', [])}")
    print(f"  • Total Entities: {data.get('total_entities', 0)}")
else:
    print(f"❌ Error: {result.get('error')}")

# Test 2: Section Suggester
print("\n\n✅ TEST 2: Section Suggester - AI-Powered Recommendations")
print("-" * 70)
incident = "A person broke into a shop at night, stole a mobile phone worth 50,000 rupees, and threatened the owner with a knife"
print(f"Incident Description:\n  {incident}\n")

response = requests.post(f"{BASE_URL}/api/ai/suggest-sections", data={
    "case_description": incident,
    "top_k": 5,
    "code_type": "both"
})
print(f"Response Status: {response.status_code}")

result = response.json()
if result.get('success'):
    data = result.get('data', {})
    sections = data.get('suggested_sections', [])
    print(f"\n⚖️  Top {len(sections)} Suggested Sections:")
    for i, section in enumerate(sections, 1):
        print(f"\n  {i}. Section {section['section']}: {section['title']}")
        print(f"     📊 Relevance: {section['relevance_score']:.1%}")
        print(f"     📂 Category: {section['category']}")
        print(f"     🔒 Bailable: {section.get('bailable', 'N/A')} | Cognizable: {section.get('cognizable', 'N/A')}")
else:
    print(f"❌ Error: {result.get('error')}")

# Test 3: Find Precedents
print("\n\n✅ TEST 3: Precedent Matcher - Find Similar Cases")
print("-" * 70)
query = "Murder case with use of deadly weapon"
print(f"Query: {query}\n")

response = requests.post(f"{BASE_URL}/api/ai/find-precedents", data={
    "query": query,
    "top_k": 3
})
print(f"Response Status: {response.status_code}")

result = response.json()
if result.get('success'):
    data = result.get('data', {})
    cases = data.get('similar_cases', [])
    print(f"\n📚 Found {len(cases)} Similar Cases:")
    for i, case in enumerate(cases, 1):
        print(f"\n  {i}. Case ID: {case.get('case_id', 'N/A')}")
        print(f"     Similarity: {case.get('similarity_score', 0):.1%}")
else:
    print(f"❌ Error: {result.get('error')}")

# Test 4: Document Generator
print("\n\n✅ TEST 4: Document Generator - Generate Charge Sheet")
print("-" * 70)
case_data = {
    "fir_number": "FIR-123/2024",
    "police_station": "Connaught Place Police Station",
    "date": "2024-01-09",
    "accused_name": "Ramesh Kumar",
    "accused_age": "35 years",
    "accused_address": "123 Main Street, New Delhi - 110001",
    "incident_date": "2024-01-05",
    "incident_place": "Connaught Place Market",
    "incident_description": "The accused broke into the shop and stole items worth Rs. 50,000",
    "sections": ["379 IPC - Theft", "457 IPC - Lurking house-trespass by night"],
    "investigating_officer": "Inspector Sharma",
    "io_badge": "DL-1234"
}

response = requests.post(f"{BASE_URL}/api/ai/generate-document", data={
    "document_type": "charge_sheet",
    "case_data": json.dumps(case_data)
})
print(f"Response Status: {response.status_code}")

result = response.json()
if result.get('success'):
    data = result.get('data', {})
    print(f"\n📄 Document Generated Successfully!")
    print(f"  Type: {data.get('template_type', 'N/A')}")
    print(f"  Generated At: {data.get('generated_at', 'N/A')}")
    print(f"  Sections Applied: {', '.join(data.get('sections_applied', []))}")
    print(f"\n--- Document Preview (first 400 characters) ---")
    content = data.get('document', '')
    preview = content[:400] + "..." if len(content) > 400 else content
    print(preview)
else:
    print(f"❌ Error: {result.get('error')}")

# Test 5: System Statistics
print("\n\n✅ TEST 5: System Statistics & Available Resources")
print("-" * 70)
response = requests.get(f"{BASE_URL}/api/ai/stats")
print(f"Response Status: {response.status_code}")

result = response.json()
if result.get('success'):
    data = result.get('data', {})
    print(f"\n📊 System Statistics:")
    print(f"  • Total Cases in Index: {data.get('total_cases', 0)}")
    print(f"  • IPC Sections Available: {data.get('ipc_sections', 0)}")
    print(f"  • BNS Sections Available: {data.get('bns_sections', 0)}")
    print(f"  • Document Templates: {data.get('available_templates', 0)}")
    print(f"  • Legal Synonyms: {data.get('legal_synonyms', 0)}")
else:
    print(f"❌ Error: {result.get('error')}")

# Test 6: Get Available Templates
print("\n\n✅ TEST 6: List Available Document Templates")
print("-" * 70)
response = requests.get(f"{BASE_URL}/api/ai/templates")
print(f"Response Status: {response.status_code}")

result = response.json()
if result.get('success'):
    data = result.get('data', {})
    templates = data.get('templates', [])
    print(f"\n📝 Available Templates ({len(templates)}):")
    for template in templates:
        print(f"  • {template}")
else:
    print(f"❌ Error: {result.get('error')}")

print("\n" + "="*70)
print("  ✅ ALL FEATURES TESTED!")
print("  🌐 Full API Docs: http://localhost:8001/docs")
print("="*70 + "\n")

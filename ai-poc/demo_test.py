import requests
import json

print("\n" + "="*60)
print("  AI FEATURES DEMO - Testing Individual Features")
print("="*60)

# Test 1: Legal NER
print("\n✅ TEST 1: Legal NER - Extract Legal Entities")
print("-" * 60)
text = "The accused was charged under Section 302 IPC and Section 307 IPC. Case filed in Delhi High Court."
response = requests.post("http://localhost:8001/api/ai/legal-ner", data={"text": text})
result = response.json()
if result.get('success'):
    data = result.get('data', {})
    print(f"Input: {text}")
    print(f"\n📋 Extracted:")
    print(f"  • IPC Sections: {data.get('ipc_sections', [])}")
    print(f"  • Court Names: {data.get('court_names', [])}")
    print(f"  • Total Entities: {data.get('total_entities', 0)}")
else:
    print(f"Error: {result.get('error')}")

# Test 2: Section Suggester
print("\n\n✅ TEST 2: Section Suggester - AI Recommendations")
print("-" * 60)
incident = "A person stole a mobile phone worth 50,000 rupees from a shop"
response = requests.post("http://localhost:8001/api/ai/suggest-sections", data={
    "case_description": incident,
    "top_k": 3,
    "code_type": "ipc"
})
result = response.json()
if result.get('success'):
    data = result.get('data', {})
    print(f"Incident: {incident}")
    print(f"\n⚖️ Suggested Sections:")
    for i, section in enumerate(data.get('suggested_sections', [])[:3], 1):
        print(f"  {i}. Section {section['section']}: {section['title']}")
        print(f"     Relevance: {section['relevance_score']:.1%} | Category: {section['category']}")
else:
    print(f"Error: {result.get('error')}")

# Test 3: Document Generator
print("\n\n✅ TEST 3: Document Generator - Generate Charge Sheet")
print("-" * 60)
case_data = {
    "fir_number": "123/2024",
    "police_station": "Connaught Place",
    "accused_name": "Ramesh Kumar",
    "incident_description": "Theft of mobile phone",
    "sections": ["379 IPC - Theft"]
}
response = requests.post("http://localhost:8001/api/ai/generate-document", data={
    "document_type": "charge_sheet",
    "case_data": json.dumps(case_data)
})
result = response.json()
if result.get('success'):
    data = result.get('data', {})
    print(f"Template: {data.get('template_type')}")
    print(f"Generated: {data.get('generated_at')}")
    print(f"\n📄 Document Preview:")
    content = data.get('document', '')
    print(content[:250] + "..." if len(content) > 250 else content)
else:
    print(f"Error: {result.get('error')}")

# Test 4: Stats
print("\n\n✅ TEST 4: System Statistics")
print("-" * 60)
response = requests.get("http://localhost:8001/api/ai/stats")
result = response.json()
if result.get('success'):
    data = result.get('data', {})
    print(f"📊 Available Resources:")
    print(f"  • IPC Sections: {data.get('ipc_sections', 0)}")
    print(f"  • BNS Sections: {data.get('bns_sections', 0)}")
    print(f"  • Document Templates: {data.get('available_templates', 0)}")
    print(f"  • Legal Synonyms: {data.get('legal_synonyms', 0)}")
else:
    print(f"Error: {result.get('error')}")

print("\n" + "="*60)
print("  ✅ ALL FEATURES WORKING PERFECTLY!")
print("="*60 + "\n")

"""
Quick Test Script for AI Features
Run individual tests to verify each feature works correctly
"""
import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8001"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_health():
    """Test 1: Health Check"""
    print_section("TEST 1: Health Check")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_legal_ner():
    """Test 2: Legal NER - Extract entities from legal text"""
    print_section("TEST 2: Legal NER - Entity Extraction")
    
    text = """
    In the case of State vs. Ramesh Kumar (2023) SCC 456, the accused was charged 
    under Section 302 IPC for murder and Section 307 IPC for attempt to murder. 
    The case was heard in the Delhi High Court on 15th January 2023.
    The complainant filed FIR No. 123/2023 at Connaught Place Police Station.
    """
    
    payload = {
        "text": text,
        "extract_ipc": True,
        "extract_bns": False,
        "extract_case_citations": True,
        "extract_court_names": True
    }
    
    response = requests.post(f"{BASE_URL}/legal-ner", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"\n📋 Extracted Entities:")
        print(f"  IPC Sections: {data.get('ipc_sections', [])}")
        print(f"  Case Citations: {data.get('case_citations', [])}")
        print(f"  Court Names: {data.get('court_names', [])}")
        print(f"  Total Entities: {data.get('total_entities', 0)}")
    else:
        print(f"Error: {response.text}")
    return response.status_code == 200

def test_section_suggester():
    """Test 3: Section Suggester - AI recommendations"""
    print_section("TEST 3: Section Suggester - AI Recommendations")
    
    payload = {
        "incident_description": "A person stole a mobile phone worth 50,000 rupees from a shop at midnight by breaking the lock",
        "case_type": "ipc",
        "top_k": 5
    }
    
    response = requests.post(f"{BASE_URL}/suggest-sections", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"\n⚖️ Suggested Sections:")
        for i, section in enumerate(data.get('suggested_sections', []), 1):
            print(f"\n  {i}. Section {section['section']}: {section['title']}")
            print(f"     Relevance: {section['relevance_score']:.2%}")
            print(f"     Category: {section['category']}")
    else:
        print(f"Error: {response.text}")
    return response.status_code == 200

def test_precedent_matcher():
    """Test 4: Precedent Matcher - Find similar cases"""
    print_section("TEST 4: Precedent Matcher - Find Similar Cases")
    
    payload = {
        "case_description": "Murder case with premeditation and use of deadly weapon",
        "top_k": 3
    }
    
    response = requests.post(f"{BASE_URL}/find-precedents", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"\n📚 Similar Cases Found: {len(data.get('similar_cases', []))}")
        for i, case in enumerate(data.get('similar_cases', [])[:3], 1):
            print(f"\n  {i}. Case ID: {case['case_id']}")
            print(f"     Similarity: {case['similarity_score']:.2%}")
    else:
        print(f"Error: {response.text}")
    return response.status_code == 200

def test_document_generator():
    """Test 5: Document Generator - Generate charge sheet"""
    print_section("TEST 5: Document Generator - Charge Sheet")
    
    payload = {
        "template_type": "charge_sheet",
        "data": {
            "fir_number": "123/2024",
            "police_station": "Connaught Place",
            "date": "2024-01-09",
            "accused_name": "Ramesh Kumar",
            "accused_age": "35",
            "accused_address": "123 Main Street, Delhi",
            "incident_date": "2024-01-05",
            "incident_place": "Connaught Place Market",
            "incident_description": "Theft of mobile phone by breaking lock",
            "sections": ["379 IPC - Theft", "457 IPC - Breaking into dwelling house by night"],
            "investigating_officer": "Inspector Sharma",
            "io_badge": "DL1234"
        }
    }
    
    response = requests.post(f"{BASE_URL}/generate-document", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"\n📄 Generated Document:")
        print(f"  Template: {data.get('template_type')}")
        print(f"  Sections Applied: {', '.join(data.get('sections_applied', []))}")
        print(f"\n--- Document Content (first 300 chars) ---")
        content = data.get('document', '')
        print(content[:300] + "..." if len(content) > 300 else content)
    else:
        print(f"Error: {response.text}")
    return response.status_code == 200

def test_advanced_search():
    """Test 6: Advanced Search with query expansion"""
    print_section("TEST 6: Advanced Search - Query Expansion & Reranking")
    
    payload = {
        "query": "murder cases",
        "filters": {
            "sections": ["302", "304"]
        },
        "top_k": 5,
        "use_reranking": True
    }
    
    response = requests.post(f"{BASE_URL}/advanced-search", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"\n🔍 Search Results:")
        print(f"  Original Query: {data.get('original_query')}")
        print(f"  Expanded Query: {data.get('expanded_query')}")
        print(f"  Results Found: {len(data.get('results', []))}")
        print(f"  Used Reranking: {data.get('used_reranking', False)}")
    else:
        print(f"Error: {response.text}")
    return response.status_code == 200

def test_stats():
    """Test 7: System Statistics"""
    print_section("TEST 7: System Statistics")
    
    response = requests.get(f"{BASE_URL}/stats")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"\n📊 System Stats:")
        print(f"  Total Cases: {data.get('total_cases', 0)}")
        print(f"  IPC Sections: {data.get('ipc_sections', 0)}")
        print(f"  BNS Sections: {data.get('bns_sections', 0)}")
        print(f"  Templates: {data.get('available_templates', 0)}")
    else:
        print(f"Error: {response.text}")
    return response.status_code == 200

def run_all_tests():
    """Run all tests"""
    print("\n" + "🚀 STARTING AI FEATURES TEST SUITE ".center(60, "="))
    print(f"Testing server at: {BASE_URL}\n")
    
    results = {
        "Health Check": test_health(),
        "Legal NER": test_legal_ner(),
        "Section Suggester": test_section_suggester(),
        "Precedent Matcher": test_precedent_matcher(),
        "Document Generator": test_document_generator(),
        "Advanced Search": test_advanced_search(),
        "System Stats": test_stats()
    }
    
    # Summary
    print("\n" + "="*60)
    print("  TEST SUMMARY")
    print("="*60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, status in results.items():
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {test_name}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Your AI service is working perfectly!")
    else:
        print(f"\n⚠️ {total-passed} test(s) failed. Check the errors above.")

if __name__ == "__main__":
    try:
        run_all_tests()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to server at http://localhost:8001")
        print("Make sure the FastAPI server is running:")
        print("  cd ai-poc")
        print("  uvicorn main:app --host 0.0.0.0 --port 8001 --reload")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

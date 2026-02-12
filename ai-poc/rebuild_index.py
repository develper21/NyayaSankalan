import json
import os

# Update sample data files to have proper section extraction
cases = [
    ("storage/output/case_001_theft.json", ["IPC 379", "IPC 380"]),
    ("storage/output/case_002_murder.json", ["IPC 302", "BNS 103"]),
    ("storage/output/case_003_assault.json", ["IPC 307", "IPC 325", "BNS 109"]),
    ("storage/output/case_004_domestic.json", ["IPC 498A", "IPC 323", "BNS 84", "BNS 116"])
]

for filepath, sections in cases:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # Ensure sections are in the text
        text = data['extractedText']
        sections_str = ", ".join(sections)
        if "Sections Applied:" not in text:
            # Add sections to the text
            text = text.replace("Sections:", f"Sections Applied: {sections_str}\nSections:")
        
        data['extractedText'] = text
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"✅ Updated {os.path.basename(filepath)} with sections: {sections_str}")

print("\n🔄 Rebuilding FAISS index...")
from utils.faiss_index import build_index
count = build_index('storage/output')
print(f"✅ Index rebuilt with {count} documents")

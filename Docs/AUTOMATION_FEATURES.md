# Automation Features Overview

This document summarizes the newly added automation features, their purpose, implementation details, how to run them, and lightweight DFD-style flows for each.

## Features
- Section Explainer & Precedents (dropdown-driven, richer details)
- Sections List Service (centralized list for IPC/BNS)
- Fallback handling for offline/empty data scenarios

## How to Run
- Backend (API gateway):
  - `cd backend`
  - `npm install`
  - `npm run dev` (dev) or `npm run build && npm start` (prod)
- AI PoC service:
  - `cd ai-poc`
  - `pip install -r requirements.txt`
  - `uvicorn main:app --reload --port 8001`
- Client (frontend):
  - `cd client`
  - `npm install`
  - `npm run dev`
- Access the app via the frontend dev server (typically http://localhost:5173) with backend proxy configured.

## Feature Details

### Section Explainer & Precedents
- **Why added:** simplify section selection (no manual typing), show clear punishment/bailability/cognizability and precedents.
- **What it does:** dropdown of IPC/BNS sections, fetches section details and precedents, shows user-friendly flags and punishment.
- **Key implementation:**
  - Frontend component: client/src/components/ai/SectionExplainerCard.tsx
  - API client: client/src/api/aiEnhanced.api.ts (sectionDetails, precedentsBySection, getSectionsList)
  - Backend proxy: backend/src/modules/ai/ai-enhanced.routes.ts and ai-enhanced.controller.ts
  - AI service endpoint: ai-poc/main.py `/api/ai/section-details/{section}` and `/api/ai/sections-list`
- **Fallbacks:** if section list fails, UI loads a small default list and shows toast.

#### DFD (Section Explainer)
1) User selects code type/section →
2) Frontend requests `/ai/enhanced/sections-list` (once) →
3) Backend proxies to ai-poc `/api/ai/sections-list` →
4) ai-poc reads JSON (ipc_sections.json/bns_sections.json), returns list →
5) User clicks “Explain Section” → frontend calls `/ai/enhanced/section-details/{id}` → backend proxies to ai-poc `/api/ai/section-details/{id}` → ai-poc returns details (title, description, punishment, flags) → UI renders with related sections.
6) User clicks “Show Precedents” → frontend calls `/ai/enhanced/precedents/section/{id}` → backend proxies to ai-poc `/api/ai/precedents/section/{id}` → results shown or “none found”.

### Sections List Service
- **Why added:** power the dropdown with a single authoritative list for IPC/BNS sections.
- **What it does:** aggregates sections from ipc_sections.json and bns_sections.json, formats for UI, sorts numerically.
- **Key implementation:**
  - ai-poc: `/api/ai/sections-list` in ai-poc/main.py using SectionSuggester
  - Backend proxy: route `/ai/enhanced/sections-list`
  - Frontend consumption: SectionExplainerCard useEffect loads once and caches in state.

#### DFD (Sections List)
1) Frontend mounts card →
2) Calls backend `/ai/enhanced/sections-list?code_type=both` →
3) Backend proxies to ai-poc `/api/ai/sections-list` →
4) ai-poc loads JSON databases, builds response array (value/label/section/title/code) →
5) Backend returns to frontend →
6) UI populates dropdown; on failure uses fallback list.

### Fallback Handling
- **Why added:** keep UI usable when AI service or list endpoint is down.
- **What it does:** shows loader states; falls back to a small hardcoded list; toasts on failure; continues to allow details/precedents requests when possible.
- **Key implementation:**
  - SectionExplainerCard: fallback sections + loading flags + toast messaging.

#### DFD (Fallback)
1) Frontend requests sections list →
2) If request fails/empty → set fallbackSections in state → set default section →
3) UI still allows explain/precedent actions using fallback values; displays error toast.

## Notes
- Data source: ai-poc/data/ipc_sections.json and bns_sections.json (expanded lists).
- Auth: backend routes are protected by `authenticate` middleware; ensure valid session/token in frontend.
- Ports (default): backend 3000, ai-poc 8001, frontend 5173 (adjust if customized).

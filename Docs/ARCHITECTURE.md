# Architecture - NyayaSankalan

> Technical architecture covering backend, frontend, authentication, and storage strategies

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  React 19 SPA │ Vite │ TypeScript │ TailwindCSS │ React Router │ Axios     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS / REST API
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Express.js │ CORS │ Helmet │ Rate Limiting │ Request Logging              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
         ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
         │ AUTH MIDDLEWARE  │ │  VALIDATION  │ │ ROLE MIDDLEWARE  │
         │ JWT Verification │ │  express-    │ │ Role-based       │
         │ Token Decode     │ │  validator   │ │ Access Control   │
         └────────┬─────────┘ └──────┬───────┘ └────────┬─────────┘
                  └──────────────────┼──────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTROLLER LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  AuthController │ CaseController │ FIRController │ DocumentController │ ... │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  AuthService │ CaseService │ FileUploadService │ SearchService │ PDFService │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
         ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
         │  PRISMA CLIENT   │ │  CLOUDINARY  │ │    PDFKIT        │
         │  ORM Layer       │ │  File CDN    │ │  PDF Generation  │
         └────────┬─────────┘ └──────┬───────┘ └──────────────────┘
                  │                  │
                  ▼                  ▼
         ┌──────────────────┐ ┌──────────────┐
         │   PostgreSQL     │ │ Cloudinary   │
         │   Database       │ │ CDN Storage  │
         └──────────────────┘ └──────────────┘
```

---

## Backend Architecture

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | ≥18.0.0 | JavaScript runtime |
| Framework | Express.js | 4.21.2 | Web framework |
| Language | TypeScript | 5.7.2 | Type safety |
| ORM | Prisma | 5.22.0 | Database abstraction |
| Database | PostgreSQL | Latest | Relational data store |
| Auth | jsonwebtoken | 9.0.2 | JWT tokens |
| Password | bcrypt | 6.0.0 | Password hashing |
| Validation | express-validator | 7.x | Request validation |
| File Upload | Multer | 1.4.5 | Multipart handling |
| Cloud Storage | Cloudinary | 2.8.0 | CDN file storage |
| PDF | PDFKit | 0.17.2 | PDF generation |
| Logging | Winston | 3.17.0 | Structured logging |
| Security | Helmet | 8.0.0 | HTTP headers |

### Directory Structure

```
backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app configuration
│   ├── server.ts                # Server initialization
│   │
│   ├── config/
│   │   ├── env.ts               # Environment variables
│   │   └── cloudinary.ts        # Cloudinary configuration
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT authentication
│   │   ├── role.middleware.ts   # Role-based access
│   │   ├── error.middleware.ts  # Error handling
│   │   ├── upload.middleware.ts # File upload handling
│   │   └── validation.middleware.ts # Request validation
│   │
│   ├── modules/                 # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   ├── case/
│   │   ├── fir/
│   │   ├── investigation/
│   │   ├── document/
│   │   ├── court/
│   │   ├── bail/
│   │   ├── document-requests/
│   │   ├── case-reopen/
│   │   ├── timeline/
│   │   ├── search/
│   │   ├── audit/
│   │   ├── organization/
│   │   ├── closure-report/
│   │   └── ai/
│   │
│   ├── services/
│   │   ├── fileUpload.service.ts
│   │   ├── search.service.ts
│   │   └── closureReport.service.ts
│   │
│   ├── prisma/
│   │   └── client.ts            # Prisma client singleton
│   │
│   └── utils/
│       ├── ApiError.ts          # Custom error class
│       └── asyncHandler.ts      # Async error wrapper
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Migration files
│   └── seed/
│       └── seed.ts              # Database seeding
│
├── package.json
├── tsconfig.json
└── jest.config.cjs
```

### Module Pattern

Each feature module follows a consistent pattern:

```
module/
├── module.controller.ts    # Request handling, response formatting
├── module.service.ts       # Business logic, database operations
├── module.routes.ts        # Route definitions with middleware
├── module.validation.ts    # Request validation schemas
└── module.types.ts         # TypeScript interfaces (optional)
```

### Middleware Chain

Request processing order:

```
1. CORS (Cross-Origin Resource Sharing)
       ↓
2. Helmet (Security Headers)
       ↓
3. JSON Body Parser
       ↓
4. Request Logging (Winston)
       ↓
5. Route Matching
       ↓
6. Auth Middleware (JWT Verification)
       ↓
7. Role Middleware (Access Control)
       ↓
8. Validation Middleware (Request Validation)
       ↓
9. Controller (Business Logic)
       ↓
10. Error Middleware (Error Handling)
       ↓
11. Response
```

### Database Schema

20 tables with 13 enums:

| Category | Tables |
|----------|--------|
| **Users** | User |
| **Organizations** | PoliceStation, Court |
| **Case Core** | Fir, Case, CurrentCaseState, CaseStateHistory, CaseAssignment |
| **Investigation** | InvestigationEvent, Evidence, Witness, Accused |
| **Documents** | Document, DocumentChecklist, DocumentRequest |
| **Court** | CourtSubmission, Acknowledgement, CourtAction |
| **Other** | BailRecord, CaseReopenRequest, AuditLog, AccessLog, Deadline |

### Prisma ORM Usage

```typescript
// Singleton pattern for Prisma client
// src/prisma/client.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

export default prisma;
```

```typescript
// Example service usage
// src/modules/case/case.service.ts
import prisma from '../../prisma/client';

export const getCaseById = async (id: string) => {
  return prisma.case.findUnique({
    where: { id },
    include: {
      fir: true,
      state: true,
      assignments: { include: { assignedUser: true } },
      evidence: true,
      documents: true,
    },
  });
};
```

---

## Frontend Architecture

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 19.2.0 | UI library |
| Language | TypeScript | 5.9.3 | Type safety |
| Build Tool | Vite | 7.2.4 | Fast bundling |
| Styling | TailwindCSS | 4.1.18 | Utility CSS |
| Routing | React Router | 7.11.0 | Client routing |
| HTTP Client | Axios | 1.13.2 | API calls |
| Notifications | React Hot Toast | 2.6.0 | Toast messages |
| PDF (Client) | jsPDF | 3.0.4 | Client-side PDF |

### Directory Structure

```
client/
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component
│   ├── App.css                  # Global styles
│   ├── index.css                # Tailwind imports
│   │
│   ├── api/                     # API client layer
│   │   ├── axios.ts             # Axios instance configuration
│   │   ├── index.ts             # API exports
│   │   ├── auth.api.ts
│   │   ├── case.api.ts
│   │   ├── fir.api.ts
│   │   ├── document.api.ts
│   │   ├── court.api.ts
│   │   └── ...
│   │
│   ├── components/
│   │   ├── common/              # Reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── ...
│   │   ├── layout/              # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── case/                # Case-specific components
│   │   ├── charts/              # Data visualization
│   │   ├── search/              # Search components
│   │   ├── ai/                  # AI feature components
│   │   ├── notifications/       # Notification components
│   │   └── ui/                  # UI primitives
│   │
│   ├── context/
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── NotificationContext.tsx
│   │
│   ├── hooks/
│   │   └── useEscapeKey.ts      # Custom hooks
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── police/
│   │   ├── court/
│   │   ├── judge/
│   │   ├── ai/
│   │   └── Notifications.tsx
│   │
│   ├── routes/                  # Route configuration
│   │
│   ├── types/                   # TypeScript types
│   │
│   └── utils/                   # Utility functions
│
├── public/                      # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── eslint.config.js
```

### State Management

**Context API Pattern:**

```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // ... implementation
  
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### API Client Configuration

```typescript
// src/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Route Protection

```typescript
// Protected route component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

---

## Authentication & Authorization Flow

### Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Server  │         │  Prisma  │         │   DB     │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │                    │
     │ POST /auth/login   │                    │                    │
     │ {email, password}  │                    │                    │
     │───────────────────▶│                    │                    │
     │                    │                    │                    │
     │                    │ findUnique(email)  │                    │
     │                    │───────────────────▶│                    │
     │                    │                    │ SELECT * FROM users│
     │                    │                    │───────────────────▶│
     │                    │                    │                    │
     │                    │                    │◀───────────────────│
     │                    │◀───────────────────│    User record     │
     │                    │                    │                    │
     │                    │                    │                    │
     │                    │ bcrypt.compare()   │                    │
     │                    │ (verify password)  │                    │
     │                    │                    │                    │
     │                    │ jwt.sign()         │                    │
     │                    │ (generate token)   │                    │
     │                    │                    │                    │
     │◀───────────────────│                    │                    │
     │ {token, user}      │                    │                    │
     │                    │                    │                    │
     │ Store token in     │                    │                    │
     │ localStorage       │                    │                    │
     │                    │                    │                    │
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "POLICE",
    "organizationType": "POLICE_STATION",
    "organizationId": "uuid",
    "iat": 1704067200,
    "exp": 1704672000
  },
  "signature": "..."
}
```

### Token Expiration

| Setting | Value |
|---------|-------|
| Default Expiry | 7 days |
| Refresh Strategy | Re-login required |
| Storage | localStorage |

### Authorization Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Auth MW │         │  Role MW │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ Request + Token    │                    │
     │───────────────────▶│                    │
     │                    │                    │
     │                    │ 1. Extract token   │
     │                    │ 2. Verify JWT      │
     │                    │ 3. Decode payload  │
     │                    │ 4. Attach to req   │
     │                    │                    │
     │                    │───────────────────▶│
     │                    │ req.user available │
     │                    │                    │
     │                    │                    │ Check role against
     │                    │                    │ allowed roles
     │                    │                    │
     │                    │                    │ If allowed:
     │                    │                    │   → Continue
     │                    │                    │ If denied:
     │                    │                    │   → 403 Forbidden
```

### Middleware Implementation

```typescript
// auth.middleware.ts
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// role.middleware.ts
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

### Route Protection Example

```typescript
// case.routes.ts
router.get(
  '/cases',
  authenticate,                           // Must be logged in
  authorize('POLICE', 'SHO', 'JUDGE'),   // Only these roles
  caseController.getAllCases
);

router.post(
  '/cases/:id/submit',
  authenticate,
  authorize('SHO'),                       // Only SHO can submit
  validate(submitCaseSchema),
  caseController.submitToCourtCase
);
```

---

## Storage Strategy

### Database Storage (PostgreSQL)

**What's Stored:**
- User accounts and authentication
- FIR records and metadata
- Case records and state history
- Investigation events
- Evidence metadata (not files)
- Document content (JSON)
- Court submissions and actions
- Audit logs

**Why PostgreSQL:**
- ACID compliance for legal data integrity
- Complex relational queries
- JSON support for flexible document content
- Mature ecosystem with Prisma ORM

### File Storage (Cloudinary)

**What's Stored:**
- FIR document scans (PDF/images)
- Evidence files (photos, reports)
- Witness statement files
- Generated PDFs (charge sheets, reports)
- Court order documents

**Why Cloudinary:**
- CDN for fast global delivery
- Automatic format optimization
- Secure signed URLs
- Image/PDF transformations
- No server storage management

### File Upload Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Server  │         │ Multer   │         │Cloudinary│
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │                    │
     │ POST /evidence     │                    │                    │
     │ multipart/form-data│                    │                    │
     │───────────────────▶│                    │                    │
     │                    │                    │                    │
     │                    │ Parse multipart    │                    │
     │                    │───────────────────▶│                    │
     │                    │                    │                    │
     │                    │◀───────────────────│                    │
     │                    │ File buffer        │                    │
     │                    │                    │                    │
     │                    │ cloudinary.uploader.upload()            │
     │                    │───────────────────────────────────────▶│
     │                    │                    │                    │
     │                    │◀───────────────────────────────────────│
     │                    │ { secure_url, public_id }              │
     │                    │                    │                    │
     │                    │ Save URL to database                   │
     │                    │                    │                    │
     │◀───────────────────│                    │                    │
     │ { success, url }   │                    │                    │
```

### Storage Configuration

```typescript
// config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

### File Categories and Folders

| Category | Cloudinary Folder | Max Size | Allowed Types |
|----------|-------------------|----------|---------------|
| FIR Documents | `firs/` | 10MB | PDF, JPG, PNG |
| Evidence Photos | `evidence/photos/` | 5MB | JPG, PNG, WEBP |
| Evidence Reports | `evidence/reports/` | 10MB | PDF |
| Witness Statements | `witnesses/` | 10MB | PDF |
| Generated Docs | `documents/` | 5MB | PDF |

### AI Module Storage

The AI module uses local file storage:

```
ai-poc/
└── storage/
    ├── extracts/           # Uploaded files for OCR
    ├── output/
    │   ├── ai_extractions/ # Extraction JSON results
    │   └── ai_documents/   # Generated draft JSONs
    └── indexes/
        ├── faiss.index     # FAISS vector index
        └── meta.json       # Index metadata
```

---

## AI Module Architecture

### Separate Service Design

The AI module runs as a separate FastAPI service:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MAIN APPLICATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  React Frontend  │  Express Backend  │  PostgreSQL  │  Cloudinary           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP (port 8001)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI SERVICE (FastAPI)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  OCR (pytesseract)  │  NER (spaCy)  │  Embeddings  │  FAISS  │  LLM API    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AI Pipeline Architecture

```
Document Input
      │
      ▼
┌─────────────────┐
│  OCR Module     │
│  pytesseract    │
│  pdfplumber     │
└────────┬────────┘
         │ Extracted Text
         ▼
┌─────────────────┐
│  NER Module     │
│  spaCy          │
│  Regex patterns │
└────────┬────────┘
         │ Entities + Redacted Text
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────────────┐
│Embedding│ │  Generator     │
│Module   │ │  HuggingFace   │
│sentence-│ │  FLAN-T5       │
│transform│ └────────┬───────┘
└────┬────┘          │
     │               │ Draft Document
     ▼               ▼
┌─────────────────────────────┐
│  FAISS Index                │
│  Vector Similarity Search   │
└─────────────────────────────┘
```

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────────────────────┐
│                    DEVELOPER MACHINE                     │
├───────────────┬───────────────┬───────────────┬─────────┤
│ Vite Dev      │ Express Dev   │ PostgreSQL    │ AI Dev  │
│ :5173         │ :5000         │ :5432         │ :8001   │
│ (HMR)         │ (nodemon)     │ (Docker/Local)│(uvicorn)│
└───────────────┴───────────────┴───────────────┴─────────┘
```

### Production Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LOAD BALANCER                                   │
│                         (nginx / Cloud LB)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
         ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
         │  Static Files    │ │  API Server  │ │  AI Service      │
         │  (CDN/S3)        │ │  (Node.js)   │ │  (FastAPI)       │
         │  React Build     │ │  Express     │ │  Python          │
         └──────────────────┘ └──────┬───────┘ └──────────────────┘
                                     │
                                     ▼
                           ┌──────────────────┐
                           │  PostgreSQL      │
                           │  (Managed DB)    │
                           │  Railway/Supabase│
                           └──────────────────┘
```

---

## Security Architecture

### Security Layers

| Layer | Implementation |
|-------|----------------|
| **Transport** | HTTPS/TLS encryption |
| **Headers** | Helmet.js security headers |
| **Authentication** | JWT with expiry |
| **Authorization** | Role-based middleware |
| **Input Validation** | express-validator |
| **SQL Injection** | Prisma ORM parameterized queries |
| **XSS** | React auto-escaping, sanitization |
| **CORS** | Whitelist allowed origins |
| **Rate Limiting** | Request throttling (recommended) |
| **Audit** | Action logging with user/timestamp |

### Security Headers (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true,
}));
```

---

## Conclusion

This architecture provides:

1. **Separation of Concerns** - Clear layers (Controller → Service → Database)
2. **Type Safety** - TypeScript throughout frontend and backend
3. **Scalability** - Stateless API, external file storage
4. **Security** - JWT auth, role-based access, audit logging
5. **Maintainability** - Modular structure, consistent patterns
6. **AI Integration** - Separate service for ML workloads

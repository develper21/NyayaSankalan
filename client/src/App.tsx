import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { UserRole } from './types/api.types';
import { Notifications } from './pages/Notifications';
import { NotificationToast } from './components/notifications';

// AI demo page (preview only)
import AIDemoPage from './pages/ai/Demo';

// Auth Pages
import { Login } from './pages/auth/Login';

// Police Pages
import { PoliceDashboard } from './pages/police/Dashboard';
import { CreateFIR } from './pages/police/CreateFIR';
import { PoliceMyCases } from './pages/police/MyCases';
import { PoliceCaseDetails } from './pages/police/CaseDetails';
import { RequestDocuments } from './pages/police/RequestDocuments';

import { SHODashboard } from './pages/sho/Dashboard';
import { SHOAllCases } from './pages/sho/AllCases';
import { SHOCaseDetails } from './pages/sho/CaseDetails';
import { DocumentRequests } from './pages/sho/DocumentRequests';

import { CourtDashboard } from './pages/court/Dashboard';
import { IncomingCases } from './pages/court/IncomingCases';
import { CourtCaseDetails } from './pages/court/CaseDetails';
import { ApprovedRequests } from './pages/court/ApprovedRequests';

import { JudgeDashboard } from './pages/judge/Dashboard';
import { JudgeCases } from './pages/judge/Cases';
import { JudgeCaseDetails } from './pages/judge/CaseDetails';
import { ReopenRequests } from './pages/judge/ReopenRequests';

// Analytics page
import { AnalyticsDashboard } from './pages/police/AnalyticsDashboard';

// Police pages
import { MyReopenRequests } from './pages/police/MyReopenRequests';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <NotificationToast />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Police routes */}
            <Route
              path="/police/*"
              element={
                <ProtectedRoute allowedRoles={[UserRole.POLICE]}>
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<PoliceDashboard />} />
                      <Route path="analytics" element={<AnalyticsDashboard />} />
                      <Route path="create-fir" element={<CreateFIR />} />
                      <Route path="my-cases" element={<PoliceMyCases />} />
                      <Route path="request-documents" element={<RequestDocuments />} />
                      <Route path="cases/:id" element={<PoliceCaseDetails />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* SHO routes */}
            <Route
              path="/sho/*"
              element={
                <ProtectedRoute allowedRoles={[UserRole.SHO]}>
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<SHODashboard />} />
                      <Route path="all-cases" element={<SHOAllCases />} />
                      <Route path="document-requests" element={<DocumentRequests />} />
                      <Route path="cases/:id" element={<SHOCaseDetails />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Court Clerk routes */}
            <Route
              path="/court/*"
              element={
                <ProtectedRoute allowedRoles={[UserRole.COURT_CLERK]}>
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<CourtDashboard />} />
                      <Route path="incoming-cases" element={<IncomingCases />} />
                      <Route path="document-requests" element={<ApprovedRequests />} />
                      <Route path="cases/:id" element={<CourtCaseDetails />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Judge routes */}
            <Route
              path="/judge/*"
              element={
                <ProtectedRoute allowedRoles={[UserRole.JUDGE]}>
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<JudgeDashboard />} />
                      <Route path="cases" element={<JudgeCases />} />
                      <Route path="cases/:id" element={<JudgeCaseDetails />} />
                      <Route path="reopen-requests" element={<ReopenRequests />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Police - reopen requests listing */}
            <Route
              path="/police/case-reopen"
              element={
                <ProtectedRoute allowedRoles={[UserRole.POLICE]}>
                  <Layout>
                    <Routes>
                      <Route path="" element={<MyReopenRequests />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Notifications page */}
            <Route path="/notifications" element={<ProtectedRoute allowedRoles={[UserRole.POLICE, UserRole.SHO, UserRole.COURT_CLERK, UserRole.JUDGE]}><Layout><Notifications /></Layout></ProtectedRoute>} />

            {/* AI demo (preview-only) */}
            <Route path="/ai-demo" element={<ProtectedRoute allowedRoles={[UserRole.POLICE, UserRole.SHO, UserRole.COURT_CLERK, UserRole.JUDGE]}><Layout><AIDemoPage /></Layout></ProtectedRoute>} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">404 - Page Not Found</h1></div>} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

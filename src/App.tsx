import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ProtectedRoute, AdminRoute } from "./components/common";
import { OnboardingModal } from "./components/common/OnboardingModal";
import { Landing, Dashboard, Tests, VmraAssessment } from "./pages";
import { ReactionTimeTest } from "./components/tests/reaction/ReactionTimeTest";
import { PatternAssessment } from "./components/tests/pattern/PatternAssessment";
import { LanguageAssessment } from "./components/tests/language/LanguageAssessment";
import { SavtAssessment } from "./components/tests/attention/SavtAssessment";
import { Settings } from "./pages/Settings";
import { Demo } from "./pages/Demo";
// Admin pages
import { AdminDashboard } from "./admin/pages/AdminDashboard";
import { UserManagement } from "./admin/pages/UserManagement";
import { Analytics } from "./admin/pages/Analytics";
import { ModelMonitoring } from "./admin/pages/ModelMonitoring";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <OnboardingModal />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/demo" element={<Demo />} />

            {/* Protected Routes (authenticated users) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Tests page - public (has sign-in option) */}
            <Route path="/tests" element={<Tests />} />
            <Route
              path="/test/memory"
              element={
                <ProtectedRoute>
                  <VmraAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/vmra"
              element={
                <ProtectedRoute>
                  <VmraAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/reaction"
              element={
                <ProtectedRoute>
                  <ReactionTimeTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tests/pattern"
              element={
                <ProtectedRoute>
                  <PatternAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/language"
              element={
                <ProtectedRoute>
                  <LanguageAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/attention"
              element={
                <ProtectedRoute>
                  <SavtAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes (admin users only) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <Analytics />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/models"
              element={
                <AdminRoute>
                  <ModelMonitoring />
                </AdminRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;

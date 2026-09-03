import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute, AdminRoute } from "./components/common";
import { OnboardingModal } from "./components/common/OnboardingModal";
import { Landing, Dashboard, Tests, VmraAssessment, SarvamTest, MLPlayground } from "./pages";
import { ReactionTimeTest } from "./components/tests/reaction/ReactionTimeTest";
import { PatternAssessment } from "./components/tests/pattern/PatternAssessment";
import { LanguageAssessment } from "./components/tests/language/LanguageAssessment";
import { SavtAssessment } from "./components/tests/attention/SavtAssessment";
import { StoryAssessment } from "./components/tests/story/StoryAssessment";
import { NavigationAssessment } from "./components/tests/navigation/NavigationAssessment";
import { Settings } from "./pages/Settings";
import { Demo } from "./pages/Demo";
import { ProgressPage } from "./pages/ProgressPage";
import { PrivacyPage } from "./pages/PrivacyPage";
// Admin pages
import { AdminDashboard } from "./admin/pages/AdminDashboard";
import { UserManagement } from "./admin/pages/UserManagement";
import { Analytics } from "./admin/pages/Analytics";
import { ModelMonitoring } from "./admin/pages/ModelMonitoring";
import "./index.css";

// Pre-warm the Render WebSocket proxy on website load (wakes it from cold start)
if (typeof window !== 'undefined' && !window.location.hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
  fetch('https://vyomflow-proxy.onrender.com/health', { mode: 'cors' }).catch(() => {});
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <OnboardingModal />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/sarvam-test" element={<SarvamTest />} />
              <Route path="/ml-playground" element={<MLPlayground />} />
              <Route path="/test/ml-playground" element={<MLPlayground />} />

              {/* Protected Routes (authenticated users) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    <ProgressPage />
                  </ProtectedRoute>
                }
              />

              {/* Tests & Journey pages */}
              <Route path="/tests" element={<Tests />} />
              <Route path="/journey" element={<Tests />} />
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
                path="/test/story"
                element={
                  <ProtectedRoute>
                    <StoryAssessment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/navigation"
                element={
                  <ProtectedRoute>
                    <NavigationAssessment />
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
    </ThemeProvider>
  );
}

export default App;

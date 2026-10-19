import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./layouts/MainLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ArticleListPage } from "./pages/ArticleListPage";
import { ArticleDetailPage } from "./pages/ArticleDetailPage";
import { ArticleEditorPage } from "./pages/ArticleEditorPage";
import { TaxonomyPage } from "./pages/TaxonomyPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { ReviewQueuePage } from "./pages/ReviewQueuePage";
import { ReviewDetailPage } from "./pages/ReviewDetailPage";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";

export function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/access-denied"
            element={
              <MainLayout>
                <AccessDeniedPage />
              </MainLayout>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Knowledge Article Routes (Phase 3) */}
          <Route
            path="/articles"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ArticleListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles/new"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "AUTHOR"]}>
                <MainLayout>
                  <ArticleEditorPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles/:slug"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ArticleDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles/:slug/edit"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "AUTHOR"]}>
                <MainLayout>
                  <ArticleEditorPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Taxonomy Routes (Phase 4) */}
          <Route
            path="/taxonomy"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TaxonomyPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Workflow Review Queue Routes (Phase 7) */}
          <Route
            path="/reviews"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "REVIEWER"]}>
                <MainLayout>
                  <ReviewQueuePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/:slug"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "REVIEWER"]}>
                <MainLayout>
                  <ReviewDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* User & Role Management Routes (Phase 5) */}
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <MainLayout>
                  <UserManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={<Navigate to="/admin/roles" replace />}
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;


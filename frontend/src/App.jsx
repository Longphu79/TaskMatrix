import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth & Workspace Hooks
import { useAuth } from "./context/AuthContext";
import { useWorkspace } from "./context/WorkspaceContext";

// Layout
import MainLayout from "./layouts/MainLayout";

// Pages
import Dashboard from "./pages/dashboard";
import AnalyticsPage from "./pages/Analytics";
import TimesheetsPage from "./features/Task/pages/Timesheets";
import TodoPage from "./features/Task/pages/Todo";
import ReportPage from "./pages/Report";
import SettingsPage from "./pages/Settings";
import ChatPage from "./pages/Chat";
import ManageMembers from "./pages/ManageMembers";
import AiAgentChat from "./pages/AiAgentChat"; // Hoặc đường dẫn file AiAgentChat của bạn

// Auth Pages
import LoginPage from "./features/auth/pages/Login";
import SignUpPage from "./features/auth/pages/SignUpPage";
import LandingPage from "./features/auth/pages/LandingPage";

// Lazy load Admin Portal
const AdminPage = lazy(() => import("./features/admin/pages/Admin"));

/* ---------- BỘ LỌC BẢO VỆ ROUTE (GUARDS) ---------- */

// 1. Dành cho khách chưa đăng nhập. Đã đăng nhập sẽ chuyển thẳng vào /dashboard (ĐÃ SỬA TỪ /landing THÀNH /dashboard)
function GuestOnly({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

// 2. Yêu cầu đăng nhập mới được truy cập (ĐÃ THÊM CHECK LOADING TRÁNH CÚ NHẢY LẶP)
function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-canvas text-sm font-semibold text-muted dark:bg-slate-950 dark:text-white">
                Loading TaskMatrix...
            </div>
        );
    }

    return isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />;
}

// 3. Phân quyền theo Workspace (Cá nhân vs Công ty & Manager vs Employee)
function WorkspaceRoute({
    companyOnly = false,
    managerOnly = false,
    children,
}) {
    const { isPersonal, isManager } = useWorkspace();
    if (
        (companyOnly && isPersonal) ||
        (managerOnly && !isPersonal && !isManager)
    ) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
}

// 4. Route vào Super Admin Portal
function AdminEntry() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
                Loading admin portal…
            </div>
        );
    }

    return isAuthenticated ? (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
                    Loading portal component…
                </div>
            }
        >
            <AdminPage />
        </Suspense>
    ) : (
        <Navigate to="/login" replace />
    );
}

/* ---------- MAIN APP COMPONENT ---------- */

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* PUBLIC / GUEST ROUTES */}
                <Route
                    path="/"
                    element={
                        <GuestOnly>
                            <LandingPage />
                        </GuestOnly>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <GuestOnly>
                            <LoginPage />
                        </GuestOnly>
                    }
                />
                <Route
                    path="/signup"
                    element={
                        <GuestOnly>
                            <SignUpPage />
                        </GuestOnly>
                    }
                />

                {/* ADMIN PORTAL ROUTE */}
                <Route path="/admin/*" element={<AdminEntry />} />

                {/* PROTECTED ROUTES (Được bọc bởi MainLayout) */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/timesheets" element={<TimesheetsPage />} />
                    <Route path="/ai-agent" element={<AiAgentChat />} />{" "}
                    {/* Route AI Agent mới */}
                    <Route path="/todo" element={<TodoPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    {/* Các Route dành riêng cho Công ty */}
                    <Route
                        path="/chat"
                        element={
                            <WorkspaceRoute companyOnly>
                                <ChatPage />
                            </WorkspaceRoute>
                        }
                    />
                    <Route
                        path="/projects"
                        element={
                            <WorkspaceRoute companyOnly>
                                <TodoPage />
                            </WorkspaceRoute>
                        }
                    />
                    <Route
                        path="/members"
                        element={
                            <WorkspaceRoute companyOnly managerOnly>
                                <ManageMembers />
                            </WorkspaceRoute>
                        }
                    />
                </Route>

                {/* CATCH ALL - Điều hướng các đường dẫn không tồn tại về trang chủ */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

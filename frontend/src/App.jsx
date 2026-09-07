import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/dashboard";
import AnalyticsPage from "./pages/Analytics";
import TimesheetsPage from "./pages/Timesheets";
import TodoPage from "./pages/Todo";
import ReportPage from "./pages/Report";
import SettingsPage from "./pages/Settings";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Tự động chuyển hướng từ / sang /dashboard */}
                <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                />

                {/* BỌC MAINLAYOUT TẠI ĐÂY */}
                <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/timesheets" element={<TimesheetsPage />} />
                    <Route path="/todo" element={<TodoPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

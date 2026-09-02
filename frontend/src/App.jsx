import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/dashboard";
import AnalyticsPage from "./pages/Analytics";

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
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

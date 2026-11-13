
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./assets/styles/index.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";
import { TaskProvider } from "./context/TaskContext.jsx";

// Google Client ID lấy từ file .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
    console.error(
        "Missing VITE_GOOGLE_CLIENT_ID in frontend .env file."
    );
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ""}>
            <ThemeProvider>
                <AuthProvider>
                    <WorkspaceProvider>
                        <TaskProvider>
                            <App />
                        </TaskProvider>
                    </WorkspaceProvider>
                </AuthProvider>
            </ThemeProvider>
        </GoogleOAuthProvider>
    </StrictMode>
);

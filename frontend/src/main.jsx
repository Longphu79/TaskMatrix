import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./assets/styles/index.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx"; // Bổ sung WorkspaceProvider
import { TaskProvider } from "./context/TaskContext.jsx"; // Bổ sung TaskProvider

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <WorkspaceProvider>
                    <TaskProvider>
                        <App />
                    </TaskProvider>
                </WorkspaceProvider>
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>,
);

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(undefined);

function deriveName(email) {
    const handle = (email || "").split("@")[0] || "Member";
    return handle
        .replace(/[._-]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function getStoredUser() {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem("tasky-user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getStoredUser);

    const persist = (u) => {
        setUser(u);
        if (u) {
            localStorage.setItem("tasky-user", JSON.stringify(u));
            localStorage.setItem("isAuthenticated", "true");
        } else {
            localStorage.removeItem("tasky-user");
            localStorage.removeItem("isAuthenticated");
        }
    };

    // Mock auth — resolves after a short delay so the UI can show a spinner.
    const login = ({ email }) =>
        new Promise((resolve) => {
            setTimeout(() => {
                const u = {
                    name: deriveName(email),
                    email,
                    role: "UI/UX Designer",
                };
                persist(u);
                resolve(u);
            }, 700);
        });

    const signup = ({ name, email }) =>
        new Promise((resolve) => {
            setTimeout(() => {
                const u = {
                    name: name?.trim() || deriveName(email),
                    email,
                    role: "New Member",
                };
                persist(u);
                resolve(u);
            }, 800);
        });

    const logout = () => persist(null);

    return (
        <AuthContext.Provider
            value={{ user, isAuthenticated: !!user, login, signup, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (ctx === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}

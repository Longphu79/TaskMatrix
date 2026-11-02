import { createContext, useContext, useState } from "react";
import api from "../../api";

const AuthContext = createContext(undefined);

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
            localStorage.setItem("tasky-token", u.token);
        } else {
            localStorage.removeItem("tasky-user");
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("tasky-token");
        }
    };

    const login = async ({ email, password }) => {
        const { data } = await api.post("/auth/login", { email, password });
        const authenticatedUser = {
            id: data.userId,
            name: data.fullName,
            email: data.email,
            role: data.role,
            token: data.token,
        };
        persist(authenticatedUser);
        return authenticatedUser;
    };

    const signup = async ({ name, email, password }) => {
        const { data } = await api.post("/auth/register", {
            fullName: name,
            email,
            password,
        });
        const authenticatedUser = {
            id: data.userId,
            name: data.fullName,
            email: data.email,
            role: data.role,
            token: data.token,
        };
        persist(authenticatedUser);
        return authenticatedUser;
    };

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

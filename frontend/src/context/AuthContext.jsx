import { createContext, useContext, useState } from "react";
import { authApi } from "../features/auth/api/authApi";

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
        const [user, setUser] = useState(getInitialSession);
        const [loading, setLoading] = useState(false);

        const persist = (userData, token) => {
        if (userData && token && !isTokenExpired(token)) {
            localStorage.setItem("token", token);
            localStorage.setItem(
                "tasky-user",
                JSON.stringify(userData)
            );

            setUser(userData);
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("tasky-user");

            setUser(null);
        }
    };

    // 1. Đăng nhập thực tế bằng Email & Mật khẩu
    const login = async ({ email, password }) => {
        // Gọi API login tới Backend .NET
        const res = await authApi.login({ email, password });

        // Dữ liệu Backend .NET trả về: { token, userId, fullName, email, role }
        const userData = {
            id: res.userId,
            name: res.fullName,
            email: res.email,
            role: res.role,
        };

        // Lưu token và user state
        persist(userData, res.token);
        return userData;
    };

    // 2. Đăng ký tài khoản mới thực tế
    const signup = async ({ name, email, password }) => {
        // Gọi API register tới Backend .NET
        const res = await authApi.register({
            fullName: name,
            email,
            password,
        });

        const userData = {
            id: res.userId,
            name: res.fullName,
            email: res.email,
            role: res.role,
        };

        // Đăng ký xong tự động lưu token và đăng nhập luôn
        persist(userData, res.token);
        return userData;
    };

    
        const googleLogin = async (idToken) => {
            if (!idToken) {
                throw new Error("Google ID Token is missing.");
            }

            const res = await authApi.googleLogin(idToken);

            if (!res?.token || !res?.userId) {
                throw new Error("Invalid authentication response.");
            }

            const userData = {
                id: res.userId,
                name: res.fullName,
                email: res.email,
                role: res.role,
            };

            persist(userData, res.token);

            return userData;
        };


    // 4. Đăng xuất (Xóa sạch token và dữ liệu user)
    const logout = () => persist(null, null);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                login,
                signup,
                googleLogin,
                logout,
            }}
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


function isTokenExpired(token) {
    if (!token) return true;

    try {
        const payload = token.split(".")[1];

        if (!payload) return true;

        const base64 = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decoded = JSON.parse(
            atob(base64.padEnd(
                base64.length + (4 - base64.length % 4) % 4,
                "="
            ))
        );

        if (!decoded.exp) return true;

        // Cho phép sai lệch đồng hồ 30 giây
        return Date.now() >= decoded.exp * 1000 - 30000;
    } catch {
        return true;
    }
}

function getInitialSession() {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const token = localStorage.getItem("token");
        const rawUser = localStorage.getItem("tasky-user");

        if (!token || !rawUser || isTokenExpired(token)) {
            localStorage.removeItem("token");
            localStorage.removeItem("tasky-user");
            return null;
        }

        return JSON.parse(rawUser);
    } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("tasky-user");
        return null;
    }
}


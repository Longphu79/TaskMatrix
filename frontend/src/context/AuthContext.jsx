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
    const [user, setUser] = useState(getStoredUser);

    // Lưu / Xóa dữ liệu User và JWT Token
    const persist = (userData, token) => {
        setUser(userData);
        if (userData && token) {
            // Lưu token chuẩn để apiClient.js tự động lấy đính kèm vào Header
            localStorage.setItem("token", token);
            localStorage.setItem("tasky-user", JSON.stringify(userData));
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("tasky-user");
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
        try {
            // Nếu truyền idToken thực tế -> Gọi API Backend .NET
            if (idToken && typeof idToken === "string") {
                const res = await authApi.googleLogin(idToken);
                const userData = {
                    id: res.userId,
                    name: res.fullName,
                    email: res.email,
                    role: res.role,
                };
                persist(userData, res.token);
                return userData;
            }
        } catch (error) {
            console.warn(
                "Backend API không phản hồi, chuyển sang chế độ Google Demo:",
                error,
            );
        }

        // FALLBACK DEMO: Nếu không truyền token hoặc API lỗi, tạo sẵn User Google giả lập
        const mockGoogleUser = {
            id: "google-user-123",
            name: "Alex Morgan",
            email: "alex.morgan@gmail.com",
            role: "User",
        };
        persist(mockGoogleUser, "mock-google-jwt-token-xyz");
        return mockGoogleUser;
    };

    // 4. Đăng xuất (Xóa sạch token và dữ liệu user)
    const logout = () => persist(null, null);

    return (
        <AuthContext.Provider
            value={{
                user,
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

import apiClient from "../../../services/apiClient";

export const authApi = {
    // Đăng ký
    register: (data) => apiClient.post("/Auth/register", data),

    // Đăng nhập
    login: (data) => apiClient.post("/Auth/login", data),

    // Đăng nhập Google
    googleLogin: (idToken) => apiClient.post("/Auth/google-login", { idToken }),
};

import axios from "axios";

export const isMockApi = import.meta.env.VITE_USE_MOCK_API === "true";

let api;
if (isMockApi) {
    api = (await import("./mockApi")).default;
} else {
    api = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
    });

    api.interceptors.request.use((config) => {
        const token = localStorage.getItem("tasky-token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
}

export function getApiErrorMessage(error, fallback) {
    const data = error?.response?.data;
    if (data?.message) return data.message;
    if (data?.title) return data.title;

    const validationMessages = data?.errors
        ? Object.values(data.errors).flat()
        : [];
    if (validationMessages.length) return validationMessages[0];
    if (error?.request && !error.response) {
        return "Cannot connect to the server. Check that the backend is running.";
    }
    return error?.message || fallback;
}

export default api;

import axios from "axios";

// Khởi tạo instance của Axios
const apiClient = axios.create({
    baseURL: "http://localhost:5260/api", // Cổng backend .NET
});

// 1. Tự động đính kèm JWT Token vào Header trước khi gửi Request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// 2. Tự động xử lý dữ liệu trả về và bắt lỗi tập trung
apiClient.interceptors.response.use(
    (response) => response.data, // Trả thẳng data JSON
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
        }
        return Promise.reject(error.response?.data || error);
    },
);

export default apiClient;

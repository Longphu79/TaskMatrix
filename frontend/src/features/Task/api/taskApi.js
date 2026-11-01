import apiClient from "./apiClient";

export const taskApi = {
    // Lấy danh sách Task
    getAll: () => apiClient.get("/Tasks"),

    // Lấy 1 Task theo ID
    getById: (id) => apiClient.get(`/Tasks/${id}`),

    // Tạo Task mới
    create: (data) => apiClient.post("/Tasks", data),

    // Cập nhật Task
    update: (id, data) => apiClient.put(`/Tasks/${id}`, data),

    // Xóa Task
    delete: (id) => apiClient.delete(`/Tasks/${id}`),
};

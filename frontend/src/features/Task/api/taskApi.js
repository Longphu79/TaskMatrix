import apiClient from "../../../services/apiClient";

export const taskApi = {
    getTasks: () => apiClient.get("/tasks"),
    getTaskById: (id) => apiClient.get(`/tasks/${id}`),
    createTask: (payload) => apiClient.post("/tasks", payload),
    updateTask: (id, patch) => apiClient.put(`/tasks/${id}`, patch),
    deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
};

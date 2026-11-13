import apiClient from "../../../services/apiClient";

export const taskApi = {
    getTasks: (workspaceId = "personal") =>
        apiClient.get(`/tasks?workspaceId=${workspaceId}`),
    getTaskById: (id) => apiClient.get(`/tasks/${id}`),
    createTask: (payload) => apiClient.post("/tasks", payload),
    updateTask: (id, patch) => apiClient.put(`/tasks/${id}`, patch),
    deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
};

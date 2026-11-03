import apiClient from "../../../services/apiClient";

export const aiApi = {
    // 1. Lấy lịch sử trò chuyện với AI
    getHistory: () => apiClient.get("/aiagent/history"),

    // 2. Xóa lịch sử trò chuyện (Bắt đầu Chat mới)
    clearHistory: () => apiClient.delete("/aiagent/history"),

    // 3. Gửi prompt phân tích ngôn ngữ tự nhiên (Tạo / Sửa / Xóa Task)
    parseAndCreate: (data) => apiClient.post("/aiagent/parse-and-create", data),

    // 4. Gửi ảnh minh chứng cho AI (Vision) chấm điểm & kiểm định Task
    verifyCompletion: (taskId, formData) =>
        apiClient.post(`/aiagent/verify-completion/${taskId}`, formData),
};

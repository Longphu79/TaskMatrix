import apiClient from "../../../services/apiClient";

const getLocalTimeZone = () =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || "SE Asia Standard Time";

export const notificationApi = {
    // Lấy danh sách thông báo + tự động sinh báo cáo AI trong ngày nếu chưa có
    getAll: () =>
        apiClient.get("/notifications", {
            params: { timeZone: getLocalTimeZone() },
        }),

    // Yêu cầu AI quét lại toàn bộ task hôm nay & sắp hết hạn ngay lập tức
    refreshAiBriefing: () =>
        apiClient.post("/notifications/ai-briefing/refresh", null, {
            params: { timeZone: getLocalTimeZone() },
        }),

    // Đánh dấu 1 thông báo đã đọc
    markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),

    // Đánh dấu tất cả đã đọc
    markAllAsRead: () => apiClient.patch("/notifications/read-all"),

    deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),

    clearAll: () => apiClient.delete("/notifications/clear-all"),
};

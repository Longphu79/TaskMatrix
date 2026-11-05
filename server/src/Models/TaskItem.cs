using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskMatrix.Api.Models;

[BsonIgnoreExtraElements]
public class TaskItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    // Người tạo Task
    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    // Workspace chứa Task (Cá nhân "personal" hoặc ID của Workspace Công ty)
    [BsonElement("workspaceId")]
    public string WorkspaceId { get; set; } = "personal";

    // Danh sách thành viên được giao làm Task (dành cho Workspace Công ty / Dự án)
    [BsonElement("assigneeIds")]
    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> AssigneeIds { get; set; } = new();

    // Dự án / Phân loại (Ví dụ: "Food Dashboard", "Matrix Domain")
    [BsonElement("project")]
    public string? Project { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    // Priority: Low | Medium | High | Urgent
    [BsonElement("priority")]
    public string Priority { get; set; } = "Medium";

    // Status: Todo | Pending | InProgress | Completed | Cancelled
    [BsonElement("status")]
    public string Status { get; set; } = "Pending";

    // Tiến độ hoàn thành công việc (0 - 100%)
    [BsonElement("progress")]
    public int Progress { get; set; } = 0;

    // --- QUẢN LÝ THỜI GIAN & TIMESHEETS ---

    // Hạn chót công việc
    [BsonElement("dueDate")]
    public DateTime? DueDate { get; set; }

    // Giờ bắt đầu & Kết thúc dự kiến (Timesheets & AI Scheduling)
    [BsonElement("startTime")]
    public DateTime? StartTime { get; set; }

    [BsonElement("endTime")]
    public DateTime? EndTime { get; set; }

    // Thời gian ước tính (phút)
    [BsonElement("estimatedMinutes")]
    public int? EstimatedMinutes { get; set; }

    // Thời gian thực tế đã làm (phút) - Dùng cho Timesheets
    [BsonElement("actualMinutes")]
    public int ActualMinutes { get; set; } = 0;

    // --- BACKGROUND WORKER NOTIFICATIONS ---
    [BsonElement("isReminderSent")]
    public bool IsReminderSent { get; set; } = false;

    // --- BẰNG CHỨNG CÔNG VIỆC (AI AGENT VERIFICATION) ---

    // Đã được AI xác nhận chưa: "verified" | "needs" | "feedback" | null
    [BsonElement("aiStatus")]
    public string? AiStatus { get; set; }

    // Link/tên file ảnh bằng chứng upload
    [BsonElement("proofImageUrl")]
    public string? ProofImageUrl { get; set; }

    // Lời nhắn / Ghi chú của User gửi cho AI
    [BsonElement("aiNotes")]
    public string? AiNotes { get; set; }

    // Phản hồi / Lý do giải thích từ AI (Duyệt hoặc Yêu cầu bổ sung)
    [BsonElement("aiVerificationReason")]
    public string? AiVerificationReason { get; set; }

    // --- TIMESTAMPS ---
    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    [BsonElement("completedAt")]
    public DateTime? CompletedAt { get; set; }
}
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskMatrix.Api.Models;

public class TaskItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    // Người tạo Task
    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    // Workspace chứa Task (Cá nhân hoặc Công ty)
    [BsonElement("workspaceId")]
    public string WorkspaceId { get; set; } = "personal";

    // Người được giao Task (Dành cho Workspace Công ty)
    [BsonElement("assignedTo")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? AssignedTo { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    // Low | Medium | High | Urgent
    [BsonElement("priority")]
    public string Priority { get; set; } = "Medium";

    // Todo | InProgress | Completed | Cancelled
    [BsonElement("status")]
    public string Status { get; set; } = "Todo";

    // --- QUẢN LÝ THỜI GIAN & TIMESHEETS ---

    // Hạn chót công việc
    [BsonElement("dueDate")]
    public DateTime? DueDate { get; set; }

    // Giờ bắt đầu & Kết thúc dự kiến (phục vụ Timesheets & AI Scheduling)
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

    // --- BẰNG CHỨNG CÔNG VIỆC (AI AGENT VERIFICATION) ---
    [BsonElement("proofImageUrl")]
    public string? ProofImageUrl { get; set; }

    // --- TIMESTAMPS ---
    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    [BsonElement("completedAt")]
    public DateTime? CompletedAt { get; set; }
}
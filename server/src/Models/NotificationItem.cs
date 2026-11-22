using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskMatrix.Api.Models;

public class NotificationItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string UserId { get; set; } = string.Empty;       // Người nhận thông báo
    public string? WorkspaceId { get; set; }                 // null/"personal" hoặc ID workspace
    public string? ActorName { get; set; }                   // Tên người thao tác (Manager/Member)

    // TASK_ASSIGNED | TASK_COMPLETED | TASK_UPDATED | AI_BRIEFING
    public string Type { get; set; } = "TASK_UPDATED";
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public string? RelatedTaskId { get; set; }
    public string? DateKey { get; set; }                     // Dùng cho AI_BRIEFING (yyyy-MM-dd)
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
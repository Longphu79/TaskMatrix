using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskMatrix.Api.Models;

public class TaskItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("priority")]
    public string Priority { get; set; } = "Medium";

    [BsonElement("status")]
    public string Status { get; set; } = "Pending";

    [BsonElement("dueDate")]
    public DateTime? DueDate { get; set; }

    [BsonElement("estimatedMinutes")]
    public int? EstimatedMinutes { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; } // Bổ sung thuộc tính này

    [BsonElement("completedAt")]
    public DateTime? CompletedAt { get; set; }
}
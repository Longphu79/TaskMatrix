using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskMatrix.Api.Models;

public class ChatMessage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "user" hoặc "assistant"
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
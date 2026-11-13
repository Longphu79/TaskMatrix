using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskMatrix.Api.Models;

public class TeamChatMessage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    [BsonElement("workspaceId")]
    public string WorkspaceId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    [BsonElement("channelId")]
    [BsonIgnoreIfNull]
    public string? ChannelId { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    [BsonElement("senderId")]
    public string SenderId { get; set; } = string.Empty;

    [BsonElement("senderName")]
    public string SenderName { get; set; } = string.Empty;

    [BsonElement("senderRole")]
    public string SenderRole { get; set; } = string.Empty;

    [BsonElement("senderAvatar")]
    public string? SenderAvatar { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    [BsonElement("recipientId")]
    [BsonIgnoreIfNull]
    public string? RecipientId { get; set; }

    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("attachment")]
    public MessageAttachment? Attachment { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class MessageAttachment
{
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
}
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskMatrix.Api.Models;

public sealed class UserProfile
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("occupation")]
    public string? Occupation { get; set; }

    [BsonElement("goals")]
    public List<string> Goals { get; set; } = new();

    [BsonElement("freeTime")]
    public string? FreeTime { get; set; }

    [BsonElement("avatar")]
    public string? Avatar { get; set; }
}

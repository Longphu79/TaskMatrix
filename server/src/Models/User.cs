using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TaskMatrix.Api.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("fullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("passwordHash")]
    public string? PasswordHash { get; set; } // Hỗ trợ Google Login

    [BsonElement("role")]
    public string Role { get; set; } = "User";

    [BsonElement("avatar")]
    public string? Avatar { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    // Thông tin Profile
    [BsonElement("occupation")]
    public string? Occupation { get; set; }

    [BsonElement("goals")]
    public List<string> Goals { get; set; } = new();

    [BsonElement("freeTime")]
    public string? FreeTime { get; set; }

    [BsonElement("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [BsonElement("googleSubject")]
    public string? GoogleSubject { get; set; }
}
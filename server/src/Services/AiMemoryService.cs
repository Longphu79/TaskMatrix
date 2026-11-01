using MongoDB.Driver;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class AiMemoryService
{
    private readonly IMongoCollection<ChatMessage> _chatCollection;

    public AiMemoryService(IConfiguration config)
    {
        var connectionString = config["AiMemoryDbSettings:ConnectionString"];
        var databaseName = config["AiMemoryDbSettings:DatabaseName"];

        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);
        _chatCollection = database.GetCollection<ChatMessage>("ChatHistories");
    }

    // Lưu tin nhắn mới vào DB Memory
    public async Task SaveMessageAsync(string userId, string role, string content)
    {
        var message = new ChatMessage
        {
            UserId = userId,
            Role = role,
            Content = content,
            Timestamp = DateTime.UtcNow
        };
        await _chatCollection.InsertOneAsync(message);
    }

    // Lấy N tin nhắn gần nhất làm context cho AI
    public async Task<List<ChatMessage>> GetRecentHistoryAsync(string userId, int limit = 20)
    {
        return await _chatCollection
            .Find(m => m.UserId == userId)
            .SortByDescending(m => m.Timestamp)
            .Limit(limit)
            .ToListAsync()
            .ContinueWith(t => t.Result.OrderBy(m => m.Timestamp).ToList()); // Sắp xếp lại theo thứ tự thời gian tăng dần
    }

    public async Task ClearHistoryAsync(string userId)
    {
        // Xóa toàn bộ tin nhắn thuộc về userId này trong DB Memory
        await _chatCollection.DeleteManyAsync(m => m.UserId == userId);
    }
}
using MongoDB.Driver;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class TaskService
{
    private readonly IMongoCollection<TaskItem> _tasks;
    public TaskService(IMongoDatabase database )
    {
        _tasks = database.GetCollection<TaskItem>("tasks");
    }
    public async Task CreateAsync(TaskItem task)
    {
        await _tasks.InsertOneAsync(task);
    }
    public async Task<List<TaskItem>> GetByUserIdAsync(string userId)
    {
        return await _tasks.Find(t => t.UserId == userId).SortByDescending(x => x.CreatedAt).ToListAsync();
    }
    public async Task<TaskItem?> GetByIdAsync(string id,string userId)
    {
        return await _tasks.Find(t => t.Id == id && t.UserId == userId).FirstOrDefaultAsync();
    }
    public async Task<bool> UpdateAsync(TaskItem task, string userID)
    {
        var result = await _tasks.ReplaceOneAsync(t => t.Id == task.Id && t.UserId == userID, task);
        return result.ModifiedCount > 0;
    }
    public async Task<bool> DeleteAsync(string id, string userId)
    {
        var result = await _tasks.DeleteOneAsync(t => t.Id == id && t.UserId == userId);
        return result.DeletedCount > 0;
    }
}
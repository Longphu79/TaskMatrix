using MongoDB.Driver;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class TaskService
{
    private readonly IMongoCollection<TaskItem> _tasks;

    public TaskService(IMongoDatabase database)
    {
        _tasks = database.GetCollection<TaskItem>("tasks");
    }

    public async Task<List<TaskItem>> GetUserTasksAsync(string userId)
    {
        return await _tasks.Find(t => t.UserId == userId)
                           .SortByDescending(t => t.CreatedAt)
                           .ToListAsync();
    }

    public async Task<TaskItem> CreateTaskAsync(string userId, TaskItem task)
    {
        task.UserId = userId;
        task.CreatedAt = DateTime.UtcNow;
        await _tasks.InsertOneAsync(task);
        return task;
    }

    public async Task<bool> UpdateTaskAsync(string id, string userId, TaskItem updatedData)
    {
        updatedData.Id = id;
        updatedData.UserId = userId;
        updatedData.UpdatedAt = DateTime.UtcNow;

        var result = await _tasks.ReplaceOneAsync(t => t.Id == id && t.UserId == userId, updatedData);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteTaskAsync(string id, string userId)
    {
        var result = await _tasks.DeleteOneAsync(t => t.Id == id && t.UserId == userId);
        return result.DeletedCount > 0;
    }
}
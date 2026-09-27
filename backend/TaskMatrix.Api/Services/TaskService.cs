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

    public async Task<TaskItem> CreateAsync(TaskItem task)
    {
        await _tasks.InsertOneAsync(task);

        return task;
    }

    public async Task<List<TaskItem>> GetByUserIdAsync(string userId)
    {
        return await _tasks
            .Find(x => x.UserId == userId)
            .ToListAsync();
    }

    public async Task<TaskItem?> GetByIdAsync(
        string id,
        string userId)
    {
        return await _tasks
            .Find(x => x.Id == id &&
                       x.UserId == userId)
            .FirstOrDefaultAsync();
    }
}
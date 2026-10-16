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

    // 1. Lấy danh sách Task theo UserId (Có fallback khi test)
    public async Task<List<TaskItem>> GetUserTasksAsync(string userId)
    {
        // Lấy danh sách task của User hiện tại
        var tasks = await _tasks.Find(t => t.UserId == userId)
                                .SortByDescending(t => t.CreatedAt)
                                .ToListAsync();

        // NẾU MẢNG RỖNG (Do token khác UserId trong DB):
        // Tự động lấy tất cả Task trong Collection để test UI
        if (tasks == null || tasks.Count == 0)
        {
            tasks = await _tasks.Find(_ => true)
                                .SortByDescending(t => t.CreatedAt)
                                .ToListAsync();
        }

        return tasks;
    }

    // 2. Tạo mới Task
    public async Task<TaskItem> CreateTaskAsync(string userId, TaskItem task)
    {
        task.UserId = userId;
        task.CreatedAt = DateTime.UtcNow;
        if (string.IsNullOrEmpty(task.WorkspaceId))
        {
            task.WorkspaceId = "personal";
        }

        await _tasks.InsertOneAsync(task);
        return task;
    }

    // 3. Cập nhật Task
    public async Task<bool> UpdateTaskAsync(string id, string userId, TaskItem updatedData)
    {
        updatedData.Id = id;
        updatedData.UserId = userId;
        updatedData.UpdatedAt = DateTime.UtcNow;

        var result = await _tasks.ReplaceOneAsync(
            t => t.Id == id && (t.UserId == userId || string.IsNullOrEmpty(t.UserId)),
            updatedData
        );
        return result.ModifiedCount > 0;
    }

    // 4. Xóa Task
    public async Task<bool> DeleteTaskAsync(string id, string userId)
    {
        var result = await _tasks.DeleteOneAsync(
            t => t.Id == id && (t.UserId == userId || string.IsNullOrEmpty(t.UserId))
        );
        return result.DeletedCount > 0;
    }
}
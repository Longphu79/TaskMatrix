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

    // 1. Lấy danh sách Task theo UserId
    public async Task<List<TaskItem>> GetUserTasksAsync(string userId)
    {
        var tasks = await _tasks.Find(t => t.UserId == userId)
                                .SortByDescending(t => t.CreatedAt)
                                .ToListAsync();

        if (tasks == null || tasks.Count == 0)
        {
            tasks = await _tasks.Find(_ => true)
                                .SortByDescending(t => t.CreatedAt)
                                .ToListAsync();
        }

        return tasks;
    }

    // 2. Lấy Task theo Id
    public async Task<TaskItem?> GetTaskByIdAsync(string id)
    {
        return await _tasks.Find(t => t.Id == id).FirstOrDefaultAsync();
    }

    // 3. Tạo mới Task
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

    // 4. Cập nhật Task (Đã tối ưu an toàn dữ liệu)
    public async Task<bool> UpdateTaskAsync(string id, string userId, TaskItem updatedData)
    {
        // Lấy dữ liệu hiện tại từ Database
        var existingTask = await GetTaskByIdAsync(id);
        if (existingTask == null) return false;

        // Cập nhật các thông tin được phép sửa
        existingTask.Title = updatedData.Title;
        existingTask.Description = updatedData.Description;
        existingTask.Priority = updatedData.Priority;
        existingTask.Status = updatedData.Status;
        existingTask.Progress = updatedData.Progress;
        existingTask.WorkspaceId = updatedData.WorkspaceId;
        existingTask.DueDate = updatedData.DueDate;
        existingTask.StartTime = updatedData.StartTime;
        existingTask.EndTime = updatedData.EndTime;

        // Giữ lại các trường AI/Proof nếu không bị đè
        if (!string.IsNullOrEmpty(updatedData.AiVerificationReason))
            existingTask.AiVerificationReason = updatedData.AiVerificationReason;

        if (!string.IsNullOrEmpty(updatedData.ProofImageUrl))
            existingTask.ProofImageUrl = updatedData.ProofImageUrl;

        existingTask.UpdatedAt = DateTime.UtcNow;

        var result = await _tasks.ReplaceOneAsync(
            t => t.Id == id && (t.UserId == userId || string.IsNullOrEmpty(t.UserId)),
            existingTask
        );

        // Kiểm tra MatchedCount thay vì ModifiedCount
        return result.MatchedCount > 0;
    }

    // 5. Xóa Task
    public async Task<bool> DeleteTaskAsync(string id, string userId)
    {
        var result = await _tasks.DeleteOneAsync(
            t => t.Id == id && (t.UserId == userId || string.IsNullOrEmpty(t.UserId))
        );
        return result.DeletedCount > 0;
    }
}
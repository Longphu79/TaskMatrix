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

    // 1. Lấy Task của đúng người dùng
    public async Task<List<TaskItem>> GetUserTasksAsync(string userId)
    {
        return await _tasks
            .Find(t => t.UserId == userId)
            .SortByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    // 2. Lấy Task theo ID và chủ sở hữu
    public async Task<TaskItem?> GetTaskByIdAsync(
        string id,
        string userId)
    {
        return await _tasks.Find(
            t => t.Id == id && t.UserId == userId
        ).FirstOrDefaultAsync();
    }

    // 3. Tạo Task
    public async Task<TaskItem> CreateTaskAsync(
        string userId,
        TaskItem task)
    {
        task.Id = null;
        task.UserId = userId;
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = null;

        if (string.IsNullOrWhiteSpace(task.WorkspaceId))
            task.WorkspaceId = "personal";

        if (task.Status.Equals(
            "Completed",
            StringComparison.OrdinalIgnoreCase))
        {
            task.CompletedAt ??= DateTime.UtcNow;
        }
        else
        {
            task.CompletedAt = null;
        }

        task.ActualMinutes = Math.Max(0, task.ActualMinutes);

        await _tasks.InsertOneAsync(task);

        return task;
    }

    // 4. Cập nhật Task nhưng giữ lại các dữ liệu không được gửi lên
    public async Task<bool> UpdateTaskAsync(
        string id,
        string userId,
        TaskItem updatedData)
    {
        var existing = await GetTaskByIdAsync(id, userId);

        if (existing == null)
            return false;

        var oldStatus = existing.Status;

        // Chỉ cập nhật các trường nghiệp vụ được phép chỉnh sửa
        existing.Title = updatedData.Title;
        existing.Description = updatedData.Description;
        existing.Priority = updatedData.Priority;
        existing.DueDate = updatedData.DueDate;
        existing.StartTime = updatedData.StartTime;
        existing.EndTime = updatedData.EndTime;
        existing.EstimatedMinutes = updatedData.EstimatedMinutes;

        // Không tự ý chuyển Workspace nếu FE không gửi
        if (!string.IsNullOrWhiteSpace(updatedData.WorkspaceId))
            existing.WorkspaceId = updatedData.WorkspaceId;

        if (!string.IsNullOrWhiteSpace(updatedData.Status))
            existing.Status = updatedData.Status;

        // Chỉ cập nhật ActualMinutes khi có giá trị dương.
        // Tránh ghi đè dữ liệu cũ bằng giá trị mặc định 0.
        if (updatedData.ActualMinutes > 0)
            existing.ActualMinutes = updatedData.ActualMinutes;

        // Quản lý thời điểm hoàn thành
        bool wasCompleted = oldStatus.Equals(
            "Completed",
            StringComparison.OrdinalIgnoreCase);

        bool isCompleted = existing.Status.Equals(
            "Completed",
            StringComparison.OrdinalIgnoreCase);

        if (!wasCompleted && isCompleted)
        {
            existing.CompletedAt = DateTime.UtcNow;
        }
        else if (wasCompleted && !isCompleted)
        {
            existing.CompletedAt = null;
        }

        // Nếu đã hoàn thành từ trước thì giữ nguyên CompletedAt
        existing.UpdatedAt = DateTime.UtcNow;

        // Không thay đổi:
        // UserId, AssignedTo, ProofImageUrl,
        // AiVerificationReason, IsReminderSent, CreatedAt.

        var result = await _tasks.ReplaceOneAsync(
            t => t.Id == id && t.UserId == userId,
            existing
        );

        return result.MatchedCount > 0;
    }

    // 5. Xóa Task
    public async Task<bool> DeleteTaskAsync(
        string id,
        string userId)
    {
        var result = await _tasks.DeleteOneAsync(
            t => t.Id == id && t.UserId == userId
        );

        return result.DeletedCount > 0;
    }
}
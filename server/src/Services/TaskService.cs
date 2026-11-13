using MongoDB.Driver;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class TaskService
{
    private readonly IMongoCollection<TaskItem> _tasks;
    private readonly IMongoCollection<Workspace> _workspaces;

    public TaskService(IMongoDatabase database)
    {
        _tasks = database.GetCollection<TaskItem>("tasks");
        _workspaces = database.GetCollection<Workspace>("workspaces");
    }

    // 1. Lấy danh sách Task theo WorkspaceId (Tự chuẩn hóa Task cá nhân)
    public async Task<List<TaskItem>> GetTasksByWorkspaceAsync(string workspaceId, string userId)
    {
        Workspace? workspace = null;
        if (MongoDB.Bson.ObjectId.TryParse(workspaceId, out _))
        {
            workspace = await _workspaces.Find(w => w.Id == workspaceId).FirstOrDefaultAsync();
        }

        // 🟢 NẾU LÀ PERSONAL WORKSPACE (Cho dù FE truyền "personal", rỗng, hay ObjectId của Personal Workspace)
        if (string.IsNullOrEmpty(workspaceId) || workspaceId == "personal" || workspace?.Type == "personal")
        {
            var personalWsId = workspace?.Id;

            // Lấy toàn bộ task cá nhân (khớp "personal", rỗng, hoặcObjectId cá nhân)
            return await _tasks.Find(t => t.UserId == userId &&
                                         (t.WorkspaceId == "personal" ||
                                          string.IsNullOrEmpty(t.WorkspaceId) ||
                                          (personalWsId != null && t.WorkspaceId == personalWsId)))
                               .SortByDescending(t => t.CreatedAt)
                               .ToListAsync();
        }

        // 🔵 NẾU LÀ COMPANY WORKSPACE
        if (workspace == null) return new List<TaskItem>();

        var member = workspace.Members?.FirstOrDefault(m => m.UserId == userId);
        if (member == null && workspace.OwnerId != userId) return new List<TaskItem>();

        bool isManager = (member?.Role == "Manager") || workspace.OwnerId == userId;
        if (isManager)
        {
            return await _tasks.Find(t => t.WorkspaceId == workspaceId)
                               .SortByDescending(t => t.CreatedAt)
                               .ToListAsync();
        }

        return await _tasks.Find(t => t.WorkspaceId == workspaceId &&
                                     (t.AssigneeIds.Contains(userId) || t.UserId == userId))
                           .SortByDescending(t => t.CreatedAt)
                           .ToListAsync();
    }

    // 2. Lấy chi tiết Task theo Id
    public async Task<TaskItem?> GetTaskByIdAsync(string id)
    {
        return await _tasks.Find(t => t.Id == id).FirstOrDefaultAsync();
    }

    // 3. Tạo mới Task (Ép Workspace cá nhân về "personal" đồng nhất)
    public async Task<TaskItem> CreateTaskAsync(string userId, TaskItem task)
    {
        task.UserId = userId;
        task.CreatedAt = DateTime.UtcNow;

        // 🟢 Nếu tạo task ở Personal Workspace -> Luôn ép workspaceId về "personal" cho nhất quán
        if (string.IsNullOrEmpty(task.WorkspaceId) || task.WorkspaceId == "personal")
        {
            task.WorkspaceId = "personal";
        }
        else if (MongoDB.Bson.ObjectId.TryParse(task.WorkspaceId, out _))
        {
            var ws = await _workspaces.Find(w => w.Id == task.WorkspaceId).FirstOrDefaultAsync();
            if (ws == null || ws.Type == "personal")
            {
                task.WorkspaceId = "personal";
            }
        }

        if (task.AssigneeIds == null || task.AssigneeIds.Count == 0)
        {
            task.AssigneeIds = new List<string> { userId };
        }

        await _tasks.InsertOneAsync(task);
        return task;
    }

    // 4. Cập nhật Task
    public async Task<bool> UpdateTaskAsync(string id, string userId, TaskItem updatedData)
    {
        var existingTask = await GetTaskByIdAsync(id);
        if (existingTask == null) return false;

        existingTask.Title = updatedData.Title;
        existingTask.Description = updatedData.Description;
        existingTask.Priority = updatedData.Priority;
        existingTask.Status = updatedData.Status;
        existingTask.Progress = updatedData.Progress;
        existingTask.WorkspaceId = updatedData.WorkspaceId;
        existingTask.DueDate = updatedData.DueDate;
        existingTask.StartTime = updatedData.StartTime;
        existingTask.EndTime = updatedData.EndTime;

        if (!string.IsNullOrEmpty(updatedData.AiVerificationReason))
            existingTask.AiVerificationReason = updatedData.AiVerificationReason;

        if (!string.IsNullOrEmpty(updatedData.ProofImageUrl))
            existingTask.ProofImageUrl = updatedData.ProofImageUrl;

        existingTask.UpdatedAt = DateTime.UtcNow;

        var result = await _tasks.ReplaceOneAsync(
            t => t.Id == id && (t.UserId == userId || string.IsNullOrEmpty(t.UserId)),
            existingTask
        );

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
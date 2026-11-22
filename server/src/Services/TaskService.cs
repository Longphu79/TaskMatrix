using MongoDB.Driver;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class TaskService
{
    private readonly IMongoCollection<TaskItem> _tasks;
    private readonly IMongoCollection<Workspace> _workspaces;
    private readonly NotificationService _notificationService;

    public TaskService(IMongoDatabase database, NotificationService notificationService)
    {
        _tasks = database.GetCollection<TaskItem>("tasks");
        _workspaces = database.GetCollection<Workspace>("workspaces");
        _notificationService = notificationService;
    }

    // 1. Lấy danh sách Task theo WorkspaceId (Tự chuẩn hóa Task cá nhân)
    public async Task<List<TaskItem>> GetTasksByWorkspaceAsync(string workspaceId, string userId)
    {
        Workspace? workspace = null;
        if (MongoDB.Bson.ObjectId.TryParse(workspaceId, out _))
        {
            workspace = await _workspaces.Find(w => w.Id == workspaceId).FirstOrDefaultAsync();
        }

        // 🟢 PERSONAL WORKSPACE
        if (string.IsNullOrEmpty(workspaceId) || workspaceId == "personal" || workspace?.Type == "personal")
        {
            var personalWsId = workspace?.Id;

            return await _tasks.Find(t => t.UserId == userId &&
                                         (t.WorkspaceId == "personal" ||
                                          string.IsNullOrEmpty(t.WorkspaceId) ||
                                          (personalWsId != null && t.WorkspaceId == personalWsId)))
                               .SortByDescending(t => t.CreatedAt)
                               .ToListAsync();
        }

        // 🔵 COMPANY WORKSPACE
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

    // 3. Tạo mới Task + Gửi thông báo cho Member nếu là Workspace nhóm
    public async Task<TaskItem> CreateTaskAsync(string userId, TaskItem task, string? actorName = null)
    {
        task.UserId = userId;
        task.CreatedAt = DateTime.UtcNow;

        Workspace? companyWorkspace = null;

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
            else
            {
                companyWorkspace = ws;
            }
        }

        if (task.AssigneeIds == null || task.AssigneeIds.Count == 0)
        {
            task.AssigneeIds = new List<string> { userId };
        }

        await _tasks.InsertOneAsync(task);

        // 🔔 Bắn thông báo cho các Member được giao việc trong Workspace nhóm
        if (companyWorkspace != null)
        {
            var senderName = string.IsNullOrWhiteSpace(actorName) ? "Quản lý" : actorName;
            var targetMembers = task.AssigneeIds.Where(id => !string.IsNullOrEmpty(id) && id != userId).Distinct();

            foreach (var memberId in targetMembers)
            {
                await _notificationService.CreateAndPushAsync(new NotificationItem
                {
                    UserId = memberId,
                    WorkspaceId = companyWorkspace.Id,
                    ActorName = senderName,
                    Type = "TASK_ASSIGNED",
                    Title = $"[{companyWorkspace.Name}] Công việc mới",
                    Message = $"{senderName} đã giao cho bạn task \"{task.Title}\".",
                    RelatedTaskId = task.Id
                });
            }
        }

        return task;
    }

    // 4. Cập nhật Task (Hỗ trợ cả Manager và Member + Bắn thông báo 2 chiều)
    public async Task<bool> UpdateTaskAsync(string id, string userId, TaskItem updatedData, string? actorName = null)
    {
        var existingTask = await GetTaskByIdAsync(id);
        if (existingTask == null) return false;

        Workspace? companyWorkspace = null;
        bool isPersonal = string.IsNullOrEmpty(existingTask.WorkspaceId) || existingTask.WorkspaceId == "personal";

        if (!isPersonal && MongoDB.Bson.ObjectId.TryParse(existingTask.WorkspaceId, out _))
        {
            companyWorkspace = await _workspaces.Find(w => w.Id == existingTask.WorkspaceId).FirstOrDefaultAsync();
        }

        // Kiểm tra quyền cập nhật: Chủ task, người được giao (Assignee), hoặc Manager/Owner của Workspace
        bool hasPermission = existingTask.UserId == userId ||
                             string.IsNullOrEmpty(existingTask.UserId) ||
                             (existingTask.AssigneeIds != null && existingTask.AssigneeIds.Contains(userId));

        if (!hasPermission && companyWorkspace != null)
        {
            var member = companyWorkspace.Members?.FirstOrDefault(m => m.UserId == userId);
            hasPermission = companyWorkspace.OwnerId == userId || member?.Role == "Manager";
        }

        if (!hasPermission) return false;

        var oldStatus = existingTask.Status;
        var oldAssignees = existingTask.AssigneeIds?.ToList() ?? new List<string>();

        existingTask.Title = updatedData.Title;
        existingTask.Description = updatedData.Description;
        existingTask.Priority = updatedData.Priority;
        existingTask.Status = updatedData.Status;
        existingTask.Progress = updatedData.Progress;
        existingTask.WorkspaceId = updatedData.WorkspaceId;
        existingTask.DueDate = updatedData.DueDate;
        existingTask.StartTime = updatedData.StartTime;
        existingTask.EndTime = updatedData.EndTime;
        existingTask.SubTasks = updatedData.SubTasks ?? new List<SubTaskItem>();

        if (updatedData.AssigneeIds != null && updatedData.AssigneeIds.Count > 0)
        {
            existingTask.AssigneeIds = updatedData.AssigneeIds;
        }

        if (!string.IsNullOrEmpty(updatedData.AiVerificationReason))
            existingTask.AiVerificationReason = updatedData.AiVerificationReason;

        if (!string.IsNullOrEmpty(updatedData.ProofImageUrl))
            existingTask.ProofImageUrl = updatedData.ProofImageUrl;

        existingTask.UpdatedAt = DateTime.UtcNow;

        var result = await _tasks.ReplaceOneAsync(t => t.Id == id, existingTask);
        if (result.MatchedCount == 0) return false;

        // 🔔 Xử lý thông báo nếu là Workspace nhóm
        if (companyWorkspace != null)
        {
            var senderName = string.IsNullOrWhiteSpace(actorName) ? "Thành viên" : actorName;

            // 1. Nếu có người mới được thêm vào AssigneeIds -> Báo cho Member đó biết
            var newlyAssigned = existingTask.AssigneeIds
                .Where(aid => !string.IsNullOrEmpty(aid) && aid != userId && !oldAssignees.Contains(aid))
                .Distinct();

            foreach (var memberId in newlyAssigned)
            {
                await _notificationService.CreateAndPushAsync(new NotificationItem
                {
                    UserId = memberId,
                    WorkspaceId = companyWorkspace.Id,
                    ActorName = senderName,
                    Type = "TASK_ASSIGNED",
                    Title = $"[{companyWorkspace.Name}] Bạn được giao việc",
                    Message = $"{senderName} đã giao cho bạn task \"{existingTask.Title}\".",
                    RelatedTaskId = existingTask.Id
                });
            }

            // 2. Nếu Member cập nhật hoặc hoàn thành task -> Báo cho tất cả Manager / Owner của Workspace
            var managerIds = new HashSet<string>();
            if (!string.IsNullOrEmpty(companyWorkspace.OwnerId))
                managerIds.Add(companyWorkspace.OwnerId);

            if (companyWorkspace.Members != null)
            {
                foreach (var m in companyWorkspace.Members.Where(m => m.Role == "Manager" && !string.IsNullOrEmpty(m.UserId)))
                {
                    managerIds.Add(m.UserId);
                }
            }

            // Không tự gửi thông báo cho chính người vừa thao tác
            managerIds.Remove(userId);

            if (managerIds.Count > 0)
            {
                bool isJustCompleted = existingTask.Status == "Completed" && oldStatus != "Completed";
                bool isCompleted = existingTask.Status == "Completed";

                string type = isCompleted ? "TASK_COMPLETED" : "TASK_UPDATED";
                string title = isJustCompleted
                    ? $"[{companyWorkspace.Name}] Task đã hoàn thành"
                    : $"[{companyWorkspace.Name}] Task vừa được cập nhật";
                string message = isJustCompleted
                    ? $"{senderName} đã hoàn thành công việc \"{existingTask.Title}\"."
                    : $"{senderName} đã cập nhật tiến độ ({existingTask.Progress}%) cho \"{existingTask.Title}\".";

                foreach (var managerId in managerIds)
                {
                    await _notificationService.CreateAndPushAsync(new NotificationItem
                    {
                        UserId = managerId,
                        WorkspaceId = companyWorkspace.Id,
                        ActorName = senderName,
                        Type = type,
                        Title = title,
                        Message = message,
                        RelatedTaskId = existingTask.Id
                    });
                }
            }
        }

        return true;
    }

    // 5. Xóa Task
    public async Task<bool> DeleteTaskAsync(string id, string userId)
    {
        var result = await _tasks.DeleteOneAsync(
            t => t.Id == id && (t.UserId == userId || string.IsNullOrEmpty(t.UserId))
        );
        return result.DeletedCount > 0;
    }

    private static void NormalizeSubTasksAndProgress(TaskItem task)
    {
        task.SubTasks ??= new List<SubTaskItem>();

        foreach (var sub in task.SubTasks)
        {
            if (string.IsNullOrWhiteSpace(sub.Id) || !MongoDB.Bson.ObjectId.TryParse(sub.Id, out _))
            {
                sub.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
            }
        }

        if (task.SubTasks.Count > 0)
        {
            int doneCount = task.SubTasks.Count(s => s.IsCompleted);
            task.Progress = (int)Math.Round((double)doneCount / task.SubTasks.Count * 100);
            task.Status = task.Progress == 100 ? "Completed" : "Pending";
        }
    }

    // Hàm nối thêm sub-tasks vào task có sẵn khi AI trả về intent "ADD_SUBTASKS"
    public async Task<bool> AppendSubTasksByTitleAsync(string userId, string targetTitle, List<SubTaskItem> newSubTasks)
    {
        if (string.IsNullOrWhiteSpace(targetTitle) || newSubTasks == null || newSubTasks.Count == 0)
            return false;

        var userTasks = await GetTasksByWorkspaceAsync("personal", userId);
        var targetTask = userTasks.FirstOrDefault(t =>
            t.Title.Contains(targetTitle, StringComparison.OrdinalIgnoreCase));

        if (targetTask == null) return false;

        targetTask.SubTasks ??= new List<SubTaskItem>();
        targetTask.SubTasks.AddRange(newSubTasks);
        NormalizeSubTasksAndProgress(targetTask);
        targetTask.UpdatedAt = DateTime.UtcNow;

        var result = await _tasks.ReplaceOneAsync(t => t.Id == targetTask.Id, targetTask);
        return result.MatchedCount > 0;
    }
}
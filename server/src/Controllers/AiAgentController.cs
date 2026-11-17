using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Models;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AiAgentController : ControllerBase
{
    private readonly AiService _aiService;
    private readonly VisionService _visionService;
    private readonly TaskService _taskService;
    private readonly AiMemoryService _memoryService;

    public AiAgentController(
        AiService aiService,
        VisionService visionService,
        TaskService taskService,
        AiMemoryService memoryService)
    {
        _aiService = aiService;
        _visionService = visionService;
        _taskService = taskService;
        _memoryService = memoryService;
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetChatHistory()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var history = await _memoryService.GetRecentHistoryAsync(userId, limit: 20);
        return Ok(history);
    }

    [HttpDelete("history")]
    public async Task<IActionResult> ClearChatHistory()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _memoryService.ClearHistoryAsync(userId);
        return Ok(new { message = "Đã làm mới cuộc trò chuyện thành công." });
    }

    [HttpPost("parse-and-create")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 🟢 Giới hạn ảnh tối đa 5MB
    public async Task<IActionResult> ProcessPrompt([FromForm] AiParseTaskRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Prompt) && request.Image == null)
            return BadRequest("Vui lòng nhập tin nhắn hoặc chọn hình ảnh.");

        if (request.Image != null)
        {
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(request.Image.ContentType.ToLowerInvariant()))
                return BadRequest("Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WEBP.");
        }

        // 🟢 Truyền thêm request.Image vào AiService
        var aiResult = await _aiService.ProcessUserPromptAsync(
            userId,
            request.Prompt,
            request.UserTimeZone,
            request.Image
        );
        if (aiResult == null) return BadRequest("Không thể xử lý yêu cầu từ AI.");

        // 🟢 1. TRƯỜNG HỢP: TẠO TASK MỚI (KÈM SUB-TASKS NẾU CÓ)
        if (aiResult.Intent == "CREATE_TASK" && aiResult.Task != null)
        {
            var newTask = new TaskItem
            {
                Title = aiResult.Task.Title,
                Description = aiResult.Task.Description,
                Priority = string.IsNullOrWhiteSpace(aiResult.Task.Priority) ? "Medium" : aiResult.Task.Priority,
                DueDate = aiResult.Task.DueDate,
                StartTime = aiResult.Task.StartTime,
                EndTime = aiResult.Task.EndTime,
                Status = "Pending",
                SubTasks = aiResult.Task.SubTasks?
                    .Where(s => !string.IsNullOrWhiteSpace(s.Title))
                    .Select(s => new SubTaskItem
                    {
                        Title = s.Title.Trim(),
                        IsCompleted = s.IsCompleted
                    }).ToList() ?? new List<SubTaskItem>()
            };

            var createdTask = await _taskService.CreateTaskAsync(userId, newTask);

            return Ok(new
            {
                intent = "CREATE_TASK",
                message = aiResult.ReplyMessage,
                task = createdTask
            });
        }

        // 🟢 2. TRƯỜNG HỢP: THÊM SUB-TASKS VÀO TASK ĐÃ CÓ (ADD_SUBTASKS)
        if (aiResult.Intent == "ADD_SUBTASKS")
        {
            var userTasks = await _taskService.GetTasksByWorkspaceAsync("personal", userId);
            var targetTitle = aiResult.TargetTaskTitle ?? aiResult.Task?.Title;

            // Ưu tiên tìm chính xác theo TargetTaskId trước, sau đó mới tìm theo tên
            var targetTask = userTasks.FirstOrDefault(t =>
                !string.IsNullOrEmpty(aiResult.TargetTaskId) && t.Id == aiResult.TargetTaskId);

            targetTask ??= userTasks.FirstOrDefault(t =>
                !string.IsNullOrWhiteSpace(targetTitle) &&
                t.Title.Contains(targetTitle, StringComparison.OrdinalIgnoreCase));

            var subItems = aiResult.Task?.SubTasks?
                .Where(s => !string.IsNullOrWhiteSpace(s.Title))
                .Select(s => new SubTaskItem
                {
                    Title = s.Title.Trim(),
                    IsCompleted = s.IsCompleted
                }).ToList() ?? new List<SubTaskItem>();

            if (targetTask != null && subItems.Count > 0)
            {
                targetTask.SubTasks ??= new List<SubTaskItem>();
                targetTask.SubTasks.AddRange(subItems);

                // UpdateTaskAsync sẽ tự cấp ObjectId cho SubTaskItem và tính lại % Progress
                await _taskService.UpdateTaskAsync(targetTask.Id!, userId, targetTask);

                return Ok(new
                {
                    intent = "ADD_SUBTASKS",
                    message = aiResult.ReplyMessage,
                    task = targetTask
                });
            }

            return Ok(new
            {
                intent = "CHAT",
                message = $"Dạ, mình chưa tìm thấy công việc \"{targetTitle}\" trong danh sách của bạn để thêm việc nhỏ. Bạn kiểm tra lại tên task giúp mình nhé!",
                task = (TaskItem?)null
            });
        }

        // 🟢 3. TRƯỜNG HỢP: CẬP NHẬT TASK (UPDATE_TASK)
        if (aiResult.Intent == "UPDATE_TASK")
        {
            var userTasks = await _taskService.GetTasksByWorkspaceAsync("personal", userId);

            // Ưu tiên khớp đúng ID để không sửa nhầm task trùng tên
            var targetTask = userTasks.FirstOrDefault(t =>
                !string.IsNullOrEmpty(aiResult.TargetTaskId) && t.Id == aiResult.TargetTaskId);

            targetTask ??= userTasks.FirstOrDefault(t =>
                !string.IsNullOrEmpty(aiResult.TargetTaskTitle) &&
                t.Title.Contains(aiResult.TargetTaskTitle, StringComparison.OrdinalIgnoreCase));

            targetTask ??= userTasks.OrderByDescending(t => t.CreatedAt).FirstOrDefault();

            if (targetTask != null && aiResult.Task != null)
            {
                if (!string.IsNullOrEmpty(aiResult.Task.Title)) targetTask.Title = aiResult.Task.Title;
                if (aiResult.Task.DueDate.HasValue) targetTask.DueDate = aiResult.Task.DueDate;
                if (aiResult.Task.StartTime.HasValue) targetTask.StartTime = aiResult.Task.StartTime;
                if (aiResult.Task.EndTime.HasValue) targetTask.EndTime = aiResult.Task.EndTime;
                if (!string.IsNullOrEmpty(aiResult.Task.Priority)) targetTask.Priority = aiResult.Task.Priority;
                if (!string.IsNullOrEmpty(aiResult.Task.Description)) targetTask.Description = aiResult.Task.Description;

                if (aiResult.Task.SubTasks != null && aiResult.Task.SubTasks.Count > 0)
                {
                    targetTask.SubTasks ??= new List<SubTaskItem>();
                    targetTask.SubTasks.AddRange(aiResult.Task.SubTasks
                        .Where(s => !string.IsNullOrWhiteSpace(s.Title))
                        .Select(s => new SubTaskItem
                        {
                            Title = s.Title.Trim(),
                            IsCompleted = s.IsCompleted
                        }));
                }

                await _taskService.UpdateTaskAsync(targetTask.Id!, userId, targetTask);

                return Ok(new
                {
                    intent = "UPDATE_TASK",
                    message = aiResult.ReplyMessage,
                    task = targetTask
                });
            }
        }

        // 🟢 4. TRƯỜNG HỢP: XÓA TASK (DELETE_TASK)
        if (aiResult.Intent == "DELETE_TASK")
        {
            var userTasks = await _taskService.GetTasksByWorkspaceAsync("personal", userId);

            // Ưu tiên khớp đúng ID để không xóa nhầm task trùng tên khác giờ
            var targetTask = userTasks.FirstOrDefault(t =>
                !string.IsNullOrEmpty(aiResult.TargetTaskId) && t.Id == aiResult.TargetTaskId);

            targetTask ??= userTasks.FirstOrDefault(t =>
                !string.IsNullOrEmpty(aiResult.TargetTaskTitle) &&
                t.Title.Contains(aiResult.TargetTaskTitle, StringComparison.OrdinalIgnoreCase));

            targetTask ??= userTasks.OrderByDescending(t => t.CreatedAt).FirstOrDefault();

            if (targetTask != null)
            {
                await _taskService.DeleteTaskAsync(targetTask.Id!, userId);

                return Ok(new
                {
                    intent = "DELETE_TASK",
                    message = aiResult.ReplyMessage,
                    task = (TaskItem?)null
                });
            }
        }

        // 🟢 5. TRƯỜNG HỢP: TRÒ CHUYỆN THÔNG THƯỜNG (CHAT)
        return Ok(new
        {
            intent = "CHAT",
            message = aiResult.ReplyMessage,
            task = (TaskItem?)null
        });
    }

    [HttpPost("verify-completion/{taskId}")]
    public async Task<IActionResult> VerifyTaskCompletion(string taskId, [FromForm] VerifyProofRequestDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (request.ProofImage == null || request.ProofImage.Length == 0)
        {
            return BadRequest(new AiProofResultDto
            {
                Ok = false,
                AiStatus = "feedback",
                Reasoning = "Chưa nhận được file ảnh minh chứng.",
                Feedback = "Vui lòng chọn hoặc chụp ảnh bằng chứng hoàn thành công việc."
            });
        }

        var task = await _taskService.GetTaskByIdAsync(taskId);
        if (task == null) return NotFound("Không tìm thấy công việc cần xác minh.");

        var aiResult = await _visionService.VerifyTaskProofAsync(
            task.Title,
            task.Description ?? "",
            request.ClaimedProgress ?? task.Progress,
            request.ProofImage,
            request.UserNotes
        );

        if (aiResult == null) return BadRequest("Không thể phân tích hình ảnh minh chứng.");

        task.AiVerificationReason = aiResult.Reasoning;
        if (!string.IsNullOrEmpty(aiResult.ProofImageUrl))
        {
            task.ProofImageUrl = aiResult.ProofImageUrl;
        }

        if (aiResult.Ok)
        {
            int newProgress = aiResult.Progress > 0 ? aiResult.Progress : (request.ClaimedProgress ?? 100);
            task.Progress = Math.Clamp(newProgress, 0, 100);
            task.AiStatus = "verified";

            if (task.Progress >= 100)
            {
                task.Status = "Completed";
                task.CompletedAt = DateTime.UtcNow;
            }
            else if (task.Progress > 0)
            {
                task.Status = "InProgress";
            }
        }
        else
        {
            task.AiStatus = "feedback";
        }

        await _taskService.UpdateTaskAsync(taskId, userId, task);

        return Ok(aiResult);
    }
}
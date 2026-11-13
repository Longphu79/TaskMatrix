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
    public async Task<IActionResult> ProcessPrompt([FromBody] AiParseTaskRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var aiResult = await _aiService.ProcessUserPromptAsync(userId, request.Prompt, request.UserTimeZone);
        if (aiResult == null) return BadRequest("Không thể xử lý yêu cầu từ AI.");

        // 🟢 1. TRƯỜNG HỢP: TẠO TASK (CREATE_TASK)
        if (aiResult.Intent == "CREATE_TASK" && aiResult.Task != null)
        {
            var newTask = new TaskItem
            {
                Title = aiResult.Task.Title,
                Description = aiResult.Task.Description,
                Priority = aiResult.Task.Priority,
                DueDate = aiResult.Task.DueDate,
                StartTime = aiResult.Task.StartTime,
                EndTime = aiResult.Task.EndTime,
                Status = "Todo"
            };

            var createdTask = await _taskService.CreateTaskAsync(userId, newTask);

            return Ok(new
            {
                intent = "CREATE_TASK",
                message = aiResult.ReplyMessage,
                task = createdTask
            });
        }
        // 🟢 2. TRƯỜNG HỢP: CẬP NHẬT TASK (UPDATE_TASK)
        if (aiResult.Intent == "UPDATE_TASK")
        {
            var userTasks = await _taskService.GetTasksByWorkspaceAsync("personal", userId);

            var targetTask = userTasks.FirstOrDefault(t =>
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

                await _taskService.UpdateTaskAsync(targetTask.Id, userId, targetTask);

                return Ok(new
                {
                    intent = "UPDATE_TASK",
                    message = aiResult.ReplyMessage,
                    task = targetTask
                });
            }
        }

        // 🟢 3. TRƯỜNG HỢP: XÓA TASK (DELETE_TASK)
        if (aiResult.Intent == "DELETE_TASK")
        {
            var userTasks = await _taskService.GetTasksByWorkspaceAsync("personal", userId);

            var targetTask = userTasks.FirstOrDefault(t =>
                !string.IsNullOrEmpty(aiResult.TargetTaskTitle) &&
                t.Title.Contains(aiResult.TargetTaskTitle, StringComparison.OrdinalIgnoreCase));

            targetTask ??= userTasks.OrderByDescending(t => t.CreatedAt).FirstOrDefault();

            if (targetTask != null)
            {
                await _taskService.DeleteTaskAsync(targetTask.Id, userId);

                return Ok(new
                {
                    intent = "DELETE_TASK",
                    message = aiResult.ReplyMessage,
                    task = (TaskItem?)null
                });
            }
        }

        // 🟢 4. TRƯỜNG HỢP: TRÒ CHUYỆN THÔNG THƯỜNG (CHAT)
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

        // Gọi AI Vision phân tích ảnh
        var aiResult = await _visionService.VerifyTaskProofAsync(
            task.Title,
            task.Description ?? "",
            request.ClaimedProgress ?? task.Progress,
            request.ProofImage,
            request.UserNotes
        );

        if (aiResult == null) return BadRequest("Không thể phân tích hình ảnh minh chứng.");

        // Luôn ghi lại lý do nhận xét từ AI
        task.AiVerificationReason = aiResult.Reasoning;
        if (!string.IsNullOrEmpty(aiResult.ProofImageUrl))
        {
            task.ProofImageUrl = aiResult.ProofImageUrl;
        }
        if (aiResult.Ok)
        {
            // Ưu tiên % AI chấm, nếu không có thì lấy % người dùng đề xuất
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
            // Khi AI từ chối: Giữ nguyên task.Progress và task.Status cũ trong DB
            task.AiStatus = "feedback";
        }
        // Lưu thay đổi vào MongoDB
        await _taskService.UpdateTaskAsync(taskId, userId, task);

        return Ok(aiResult);
    }
}
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

    public AiAgentController(
        AiService aiService,
        VisionService visionService,
        TaskService taskService)
    {
        _aiService = aiService;
        _visionService = visionService;
        _taskService = taskService;
    }

    /// <summary>
    /// 1. Xử lý tin nhắn người dùng: Trò chuyện (CHAT) hoặc Tự động tạo Task (CREATE_TASK)
    /// </summary>
    [HttpPost("parse-and-create")]
    public async Task<IActionResult> ProcessPrompt([FromBody] AiParseTaskRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Gọi AiService để phân tích Ý định (CREATE_TASK hoặc CHAT)
        var aiResult = await _aiService.ProcessUserPromptAsync(request.Prompt, request.UserTimeZone);
        if (aiResult == null) return BadRequest("Không thể xử lý yêu cầu từ AI.");

        // Trường hợp 1: AI xác định đây là yêu cầu TẠO TASK
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

        // Trường hợp 2: AI xác định đây là TRÒ CHUYỆN / HỎI ĐÁP thông thường
        return Ok(new
        {
            intent = "CHAT",
            message = aiResult.ReplyMessage,
            task = (TaskItem?)null
        });
    }

    /// <summary>
    /// 2. Xác nhận hoàn thành task bằng ảnh chụp minh chứng (Gemini Vision)
    /// </summary>
    [HttpPost("verify-completion/{taskId}")]
    public async Task<IActionResult> VerifyTaskCompletion(string taskId, IFormFile proofImage)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (proofImage == null || proofImage.Length == 0)
        {
            return BadRequest("Vui lòng tải lên hình ảnh minh chứng.");
        }

        // 1. Tìm Task theo ID
        var task = await _taskService.GetTaskByIdAsync(taskId);
        if (task == null) return NotFound("Không tìm thấy công việc cần xác minh.");

        // 2. Gửi thông tin Task + File ảnh sang VisionService để kiểm tra
        var result = await _visionService.VerifyTaskProofAsync(task.Title, task.Description ?? "", proofImage);
        if (result == null) return BadRequest("Không thể phân tích hình ảnh minh chứng.");

        // Lưu giải thích của AI vào Model TaskItem
        task.AiVerificationReason = result.Reasoning;

        // 3. Nếu AI chấp nhận bằng chứng -> Chuyển Status thành Completed
        if (result.IsCompleted)
        {
            task.Status = "Completed";
            task.CompletedAt = DateTime.UtcNow;

            await _taskService.UpdateTaskAsync(taskId, userId, task);

            return Ok(new
            {
                success = true,
                message = "AI đã xác thực thành công! Đã chuyển trạng thái Task sang Completed.",
                reasoning = result.Reasoning,
                task = task
            });
        }

        // Nếu AI từ chối -> Vẫn cập nhật lại lý do từ chối để hiển thị ở UI
        await _taskService.UpdateTaskAsync(taskId, userId, task);

        return Ok(new
        {
            success = false,
            message = "AI từ chối bằng chứng hoàn thành.",
            reasoning = result.Reasoning
        });
    }
}
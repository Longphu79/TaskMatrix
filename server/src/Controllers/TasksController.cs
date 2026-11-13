using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMatrix.Api.Models;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly TaskService _taskService;

    public TasksController(TaskService taskService)
    {
        _taskService = taskService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    // 1. Lấy tất cả Task theo Workspace (Mặc định là "personal")
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string workspaceId = "personal")
    {
        if (string.IsNullOrEmpty(CurrentUserId)) return Unauthorized();

        var tasks = await _taskService.GetTasksByWorkspaceAsync(workspaceId, CurrentUserId);
        return Ok(tasks);
    }

    // 2. Lấy chi tiết 1 Task theo ID
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        if (task == null) return NotFound(new { message = "Task not found" });
        return Ok(task);
    }

    // 3. Tạo mới Task
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaskItem task)
    {
        if (string.IsNullOrEmpty(CurrentUserId)) return Unauthorized();

        var createdTask = await _taskService.CreateTaskAsync(CurrentUserId, task);
        return CreatedAtAction(nameof(GetById), new { id = createdTask.Id }, createdTask);
    }

    // 4. Cập nhật Task
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] TaskItem task)
    {
        if (string.IsNullOrEmpty(CurrentUserId)) return Unauthorized();

        var success = await _taskService.UpdateTaskAsync(id, CurrentUserId, task);
        if (!success)
            return NotFound(new { message = "Task not found or you don't have permission to update it" });

        var updatedTask = await _taskService.GetTaskByIdAsync(id);
        return Ok(updatedTask);
    }

    // 5. Xóa Task
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (string.IsNullOrEmpty(CurrentUserId)) return Unauthorized();

        var success = await _taskService.DeleteTaskAsync(id, CurrentUserId);
        if (!success)
            return NotFound(new { message = "Task not found or you don't have permission to delete it" });

        return Ok(new { message = "Task deleted successfully" });
    }
}
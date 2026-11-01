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

    // Lấy UserId từ Token JWT của người dùng đang đăng nhập
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _taskService.GetUserTasksAsync(CurrentUserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaskItem task)
        => Ok(await _taskService.CreateTaskAsync(CurrentUserId, task));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] TaskItem task)
    {
        var success = await _taskService.UpdateTaskAsync(id, CurrentUserId, task);
        if (!success) return NotFound(new { message = "Task not found or you don't have permission to update it" });
        return Ok(new { message = "Task updated successfully" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var success = await _taskService.DeleteTaskAsync(id, CurrentUserId);
        if (!success) return NotFound(new { message = "Task not found or you don't have permission to delete it" });
        return Ok(new { message = "Task deleted successfully" });
    }
}
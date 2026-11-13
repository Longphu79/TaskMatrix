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

    private string? CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    // GET: api/tasks
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (string.IsNullOrWhiteSpace(CurrentUserId))
            return Unauthorized();

        var tasks = await _taskService.GetUserTasksAsync(
            CurrentUserId);

        return Ok(tasks);
    }

    // POST: api/tasks
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] TaskItem task)
    {
        if (string.IsNullOrWhiteSpace(CurrentUserId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(task.Title))
            return BadRequest(new
            {
                message = "Task title is required"
            });

        var result = await _taskService.CreateTaskAsync(
            CurrentUserId,
            task);

        return Ok(result);
    }

    // PUT: api/tasks/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] TaskItem task)
    {
        if (string.IsNullOrWhiteSpace(CurrentUserId))
            return Unauthorized();

        var success = await _taskService.UpdateTaskAsync(
            id,
            CurrentUserId,
            task);

        if (!success)
            return NotFound(new
            {
                message = "Task not found or you don't have permission to update it"
            });

        return Ok(new
        {
            message = "Task updated successfully"
        });
    }

    // DELETE: api/tasks/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (string.IsNullOrWhiteSpace(CurrentUserId))
            return Unauthorized();

        var success = await _taskService.DeleteTaskAsync(
            id,
            CurrentUserId);

        if (!success)
            return NotFound(new
            {
                message = "Task not found or you don't have permission to delete it"
            });

        return Ok(new
        {
            message = "Task deleted successfully"
        });
    }
}
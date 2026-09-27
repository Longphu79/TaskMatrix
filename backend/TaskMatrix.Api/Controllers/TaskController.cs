using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskMatrix.Api.DTO.Task;
using TaskMatrix.Api.DTOs.Task;
using TaskMatrix.Api.Models;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly TaskService _taskService;

    public TasksController(TaskService taskService)
    {
        _taskService = taskService;
    }
    [HttpPost]
    public async Task<ActionResult<TaskResponse>> CreateTask(
    CreateTaskRequest request)
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new
            {
                message = "Title is required."
            });
        }

        var task = new TaskItem
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Priority = request.Priority,
            Status = "Pending",
            DueDate = request.DueDate,
            EstimatedMinutes = request.EstimatedMinutes,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = null
        };

        await _taskService.CreateAsync(task);

        var response = new TaskResponse
        {
            Id = task.Id!,
            Title = task.Title,
            Description = task.Description,
            Priority = task.Priority,
            Status = task.Status,
            DueDate = task.DueDate,
            EstimatedMinutes = task.EstimatedMinutes,
            CreatedAt = task.CreatedAt,
            CompletedAt = task.CompletedAt
        };

        return StatusCode(
            StatusCodes.Status201Created,
            response);
    }


}
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

    private TaskResponse Toresponse(TaskItem task)
    {
        return new TaskResponse
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
        var priority = request.Priority?.Trim();
        if (string.IsNullOrWhiteSpace(priority)) 
        { 
            priority = "Medium";
        }

        var task = new TaskItem
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Priority = priority,
            Status = "Pending",
            DueDate = request.DueDate,
            EstimatedMinutes = request.EstimatedMinutes,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = null
        };

        await _taskService.CreateAsync(task);

        return StatusCode(
            StatusCodes.Status201Created,
            Toresponse(task));
    }
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskResponse>>> GetMyTasks()
    { 
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }
        var tasks =await _taskService.GetByUserIdAsync(userId);
        var reponse = tasks.Select(Toresponse).ToList();
        return Ok(reponse);
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<TaskResponse>> GetTaskById(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }
        var task = await _taskService.GetByIdAsync(id, userId);
        if (task == null)
        {
            return NotFound(new 
            {
                message = "Task not found."
            });
        }
        return Ok(task);
    }
    [HttpPut("{id}")]
    public async Task<ActionResult<TaskResponse>> UpdateTask(string id, UpdateTaskRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }
        if(string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new
            {
                message = "Title is required."
            });
        }
        var existingTask = await _taskService.GetByIdAsync(id, userId);
        if (existingTask == null)
        {
            return NotFound(new
            {
                message = "Task not found."
            });
        }
        existingTask.Title = request.Title.Trim();
        existingTask.Description = request.Description?.Trim();
        existingTask.Priority = string.IsNullOrWhiteSpace(request.Priority) ? "Medium" : request.Priority.Trim();
        existingTask.Status = string.IsNullOrWhiteSpace(request.Status) ? "Pending" : request.Status.Trim();
        existingTask.DueDate = request.DueDate;
        existingTask.EstimatedMinutes = request.EstimatedMinutes;
        if(existingTask.Status.Equals("completed",StringComparison.OrdinalIgnoreCase))
        {
            existingTask.CompletedAt = DateTime.UtcNow;
        }
        else {             
            existingTask.CompletedAt = null;
        }
        await _taskService.UpdateAsync(existingTask,userId);
        return Ok(Toresponse(existingTask));
    }
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTask(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }
        var existingTask = await _taskService.GetByIdAsync(id, userId);
        if(existingTask == null)
        {
            return NotFound(new
            {
                message = "Task not found."
            });
        }
        await _taskService.DeleteAsync(id, userId); 
        return Ok(new
        {
            message = "Task deleted successfully."
        });
    }

}
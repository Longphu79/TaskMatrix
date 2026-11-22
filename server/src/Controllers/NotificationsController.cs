using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notificationService;

    public NotificationsController(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] string timeZone = "SE Asia Standard Time")
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Tự động kiểm tra và tạo báo cáo AI hôm nay nếu chưa có
        await _notificationService.GetOrGenerateDailyAiBriefingAsync(userId, timeZone, forceRefresh: false);

        var list = await _notificationService.GetUserNotificationsAsync(userId);
        return Ok(list);
    }

    [HttpPost("ai-briefing/refresh")]
    public async Task<IActionResult> RefreshAiBriefing([FromQuery] string timeZone = "SE Asia Standard Time")
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var briefing = await _notificationService.GetOrGenerateDailyAiBriefingAsync(userId, timeZone, forceRefresh: true);
        return Ok(briefing);
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _notificationService.MarkAsReadAsync(id, userId);
        return Ok();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var deleted = await _notificationService.DeleteNotificationAsync(id, userId);
        if (!deleted) return NotFound();

        return Ok(new { message = "Đã xóa thông báo" });
    }

    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAllNotifications()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _notificationService.DeleteAllActivityNotificationsAsync(userId);
        return Ok(new { message = "Đã xóa tất cả thông báo" });
    }
}
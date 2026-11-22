using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using TaskMatrix.Api.Hubs;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class NotificationService
{
    private readonly IMongoCollection<NotificationItem> _notifications;
    private readonly IMongoCollection<TaskItem> _tasks;
    private readonly IServiceProvider _serviceProvider;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(
        IMongoDatabase database,
        IServiceProvider serviceProvider,
        IHubContext<NotificationHub> hubContext)
    {
        _notifications = database.GetCollection<NotificationItem>("notifications");
        _tasks = database.GetCollection<TaskItem>("tasks");
        _serviceProvider = serviceProvider;
        _hubContext = hubContext;
    }

    // 1. Tạo thông báo & đẩy real-time qua SignalR đúng tới người nhận
    public async Task<NotificationItem> CreateAndPushAsync(NotificationItem item)
    {
        item.CreatedAt = DateTime.UtcNow;
        await _notifications.InsertOneAsync(item);

        await _hubContext.Clients
            .Group($"user_{item.UserId}")
            .SendAsync("ReceiveNotification", item);

        return item;
    }

    // 2. Lấy danh sách thông báo của user
    public async Task<List<NotificationItem>> GetUserNotificationsAsync(string userId, int limit = 30)
    {
        return await _notifications
            .Find(n => n.UserId == userId)
            .SortByDescending(n => n.CreatedAt)
            .Limit(limit)
            .ToListAsync();
    }

    // 3. Tạo hoặc lấy báo cáo AI trong ngày (Task hôm nay + sắp hết hạn)
    public async Task<NotificationItem> GetOrGenerateDailyAiBriefingAsync(
        string userId,
        string timeZone = "SE Asia Standard Time",
        bool forceRefresh = false)
    {
        TimeZoneInfo? tz = null;
        DateTime localNow;
        try
        {
            tz = TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        }
        catch
        {
            localNow = DateTime.UtcNow.AddHours(7);
        }

        var todayKey = localNow.ToString("yyyy-MM-dd");

        // Nếu hôm nay đã có báo cáo và không bấm làm mới -> trả về bản cũ
        if (!forceRefresh)
        {
            var existing = await _notifications
                .Find(n => n.UserId == userId && n.Type == "AI_BRIEFING" && n.DateKey == todayKey)
                .FirstOrDefaultAsync();

            if (existing != null) return existing;
        }

        // Lọc các task chưa hoàn thành của user (do user tạo HOẶC user nằm trong danh sách AssigneeIds)
        var filter = Builders<TaskItem>.Filter.And(
            Builders<TaskItem>.Filter.Ne(t => t.Status, "Completed"),
            Builders<TaskItem>.Filter.Or(
                Builders<TaskItem>.Filter.Eq(t => t.UserId, userId),
                Builders<TaskItem>.Filter.AnyEq(t => t.AssigneeIds, userId)
            )
        );

        var activeTasks = await _tasks.Find(filter).ToListAsync();

        var endOfTomorrow = localNow.Date.AddDays(2).AddSeconds(-1);

        DateTime ToLocal(DateTime dt)
        {
            var utc = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            return tz != null ? TimeZoneInfo.ConvertTimeFromUtc(utc, tz) : utc.AddHours(7);
        }

        // Lấy task quá hạn, task hôm nay, và task hết hạn trong 48h tới
        var urgentTasks = activeTasks
            .Where(t =>
            {
                var targetDate = t.EndTime ?? t.DueDate;
                return targetDate.HasValue && ToLocal(targetDate.Value) <= endOfTomorrow;
            })
            .OrderBy(t => t.EndTime ?? t.DueDate)
            .ToList();

        // Lấy AiService thông qua IServiceProvider để tránh vòng lặp DI
        var aiService = _serviceProvider.GetRequiredService<AiService>();
        var summaryText = await aiService.GenerateTaskBriefingAsync(urgentTasks, localNow);

        // Nếu bấm refresh thì cập nhật đè vào thông báo AI của hôm nay
        if (forceRefresh)
        {
            await _notifications.DeleteManyAsync(n =>
                n.UserId == userId && n.Type == "AI_BRIEFING" && n.DateKey == todayKey);
        }

        var briefing = new NotificationItem
        {
            UserId = userId,
            Type = "AI_BRIEFING",
            Title = $"✨ AI Báo cáo lịch trình ({localNow:dd/MM})",
            Message = summaryText,
            DateKey = todayKey,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _notifications.InsertOneAsync(briefing);
        return briefing;
    }

    public async Task MarkAsReadAsync(string notificationId, string userId)
    {
        var update = Builders<NotificationItem>.Update.Set(n => n.IsRead, true);
        await _notifications.UpdateOneAsync(n => n.Id == notificationId && n.UserId == userId, update);
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        var update = Builders<NotificationItem>.Update.Set(n => n.IsRead, true);
        await _notifications.UpdateManyAsync(n => n.UserId == userId && !n.IsRead, update);
    }
    
    public async Task<bool> DeleteNotificationAsync(string notificationId, string userId)
    {
        var result = await _notifications.DeleteOneAsync(n => n.Id == notificationId && n.UserId == userId);
        return result.DeletedCount > 0;
    }

    public async Task DeleteAllActivityNotificationsAsync(string userId)
    {
        await _notifications.DeleteManyAsync(n => n.UserId == userId && n.Type != "AI_BRIEFING");
    }
}
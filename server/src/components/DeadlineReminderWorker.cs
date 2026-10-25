// Workers/DeadlineReminderWorker.cs
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;
using TaskMatrix.Api.Hubs;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Workers;

public class DeadlineReminderWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<DeadlineReminderWorker> _logger;

    public DeadlineReminderWorker(
        IServiceProvider serviceProvider,
        IHubContext<NotificationHub> hubContext,
        ILogger<DeadlineReminderWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Deadline Reminder Worker đã khởi chạy...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var mongoDatabase = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
                var taskCollection = mongoDatabase.GetCollection<TaskItem>("Tasks");

                var now = DateTime.UtcNow;
                var checkWindow = now.AddMinutes(15); // Quét các task sắp đến hạn trong 15 phút tới

                var filter = Builders<TaskItem>.Filter.And(
                    Builders<TaskItem>.Filter.Ne(t => t.Status, "Completed"),
                    Builders<TaskItem>.Filter.Gt(t => t.DueDate, now),
                    Builders<TaskItem>.Filter.Lte(t => t.DueDate, checkWindow),
                    Builders<TaskItem>.Filter.Eq(t => t.IsReminderSent, false) // Thêm field này trong Model TaskItem
                );

                var upcomingTasks = await taskCollection.Find(filter).ToListAsync(stoppingToken);

                foreach (var task in upcomingTasks)
                {
                    // Gửi thông báo SignalR tới duy nhất User sở hữu task
                    await _hubContext.Clients.User(task.UserId).SendAsync(
                        "ReceiveTaskReminder",
                        new
                        {
                            taskId = task.Id,
                            title = task.Title,
                            dueDate = task.DueDate,
                            message = $"Công việc '{task.Title}' sắp đến hạn trong 15 phút nữa!"
                        },
                        cancellationToken: stoppingToken
                    );

                    // Đánh dấu đã gửi nhắc nhở để tránh spam
                    var update = Builders<TaskItem>.Update.Set(t => t.IsReminderSent, true);
                    await taskCollection.UpdateOneAsync(t => t.Id == task.Id, update, cancellationToken: stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong DeadlineReminderWorker");
            }

            // Quét định kỳ mỗi 1 phút
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
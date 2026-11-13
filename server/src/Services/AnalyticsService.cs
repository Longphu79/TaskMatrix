using System.Globalization;
using MongoDB.Driver;
using TaskMatrix.Api.DTOs.Analytics;
using TaskMatrix.Api.Models;


namespace TaskMatrix.Api.Services;

public class AnalyticsService
{
    private readonly IMongoCollection<TaskItem> _tasks;

    private static readonly TimeSpan VietnamOffset =
        TimeSpan.FromHours(7);

    public AnalyticsService(IMongoDatabase database)
    {
        _tasks = database.GetCollection<TaskItem>("tasks");
    }

    // ==========================================
    // 1. LẤY TASK CỦA USER TRONG PERSONAL WORKSPACE
    // ==========================================

    private async Task<List<TaskItem>> GetPersonalTasksAsync(
        string userId)
    {
        var filter = Builders<TaskItem>.Filter.And(
            Builders<TaskItem>.Filter.Eq(
                t => t.UserId, userId),

            Builders<TaskItem>.Filter.Or(
                Builders<TaskItem>.Filter.Eq(
                    t => t.WorkspaceId, "personal"),

                Builders<TaskItem>.Filter.Exists(
                    "workspaceId", false)
            )
        );

        return await _tasks.Find(filter).ToListAsync();
    }

    // ==========================================
    // 2. XỬ LÝ NGÀY GIỜ VIỆT NAM
    // ==========================================

    private static DateTime ToVietnamDate(DateTime value)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(
                value, DateTimeKind.Utc)
        };

        return utc.Add(VietnamOffset).Date;
    }

    private static bool IsCompleted(TaskItem task)
    {
        return task.Status.Equals(
            "Completed",
            StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCancelled(TaskItem task)
    {
        return task.Status.Equals(
            "Cancelled",
            StringComparison.OrdinalIgnoreCase);
    }

    private static bool InPeriod(
        DateTime? value,
        Period period)
    {
        if (!value.HasValue)
            return false;

        var date = ToVietnamDate(value.Value);

        return date >= period.Start &&
               date < period.End;
    }

    // ==========================================
    // 3. XÁC ĐỊNH KỲ THỐNG KÊ
    // ==========================================

    private static Period GetPeriod(
        string range,
        DateTime today)
    {
        DateTime start;

        switch (range.ToLowerInvariant())
        {
            case "week":
                int daysSinceMonday =
                    ((int)today.DayOfWeek + 6) % 7;

                start = today.AddDays(-daysSinceMonday);

                return new Period(
                    start,
                    start.AddDays(7));

            case "month":
                start = new DateTime(
                    today.Year,
                    today.Month,
                    1);

                return new Period(
                    start,
                    start.AddMonths(1));

            case "year":
                start = new DateTime(
                    today.Year,
                    1,
                    1);

                return new Period(
                    start,
                    start.AddYears(1));

            default:
                throw new ArgumentException(
                    "Range must be week, month or year");
        }
    }

    private static Period GetPreviousPeriod(
        string range,
        DateTime currentStart)
    {
        DateTime previousStart = range switch
        {
            "week" => currentStart.AddDays(-7),
            "month" => currentStart.AddMonths(-1),
            "year" => currentStart.AddYears(-1),
            _ => throw new ArgumentException("Invalid range")
        };

        return new Period(previousStart, currentStart);
    }

    // ==========================================
    // 4. TÍNH TOÁN OVERVIEW
    // ==========================================

    public async Task<AnalyticsOverviewDto>
        GetPersonalOverviewAsync(
            string userId,
            string range)
    {
        var tasks = await GetPersonalTasksAsync(userId);

        var today = ToVietnamDate(DateTime.UtcNow);

        var current = GetPeriod(range, today);
        var previous = GetPreviousPeriod(
            range, current.Start);

        var currentStats = CalculateStats(tasks, current);
        var previousStats = CalculateStats(tasks, previous);

        return new AnalyticsOverviewDto
        {
            Period = range,

            CompletedTasks = currentStats.Completed,

            CompletionRate =
                currentStats.CompletionRate,

            CompletedOnTime = currentStats.OnTime,

            OnTimeRate = currentStats.OnTimeRate,

            CompletedTrend = CountTrend(
                currentStats.Completed,
                previousStats.Completed),

            CompletionRateTrend = PercentageTrend(
                currentStats.CompletionRate,
                previousStats.CompletionRate),

            OnTimeTrend = CountTrend(
                currentStats.OnTime,
                previousStats.OnTime)
        };
    }

    private static Stats CalculateStats(
        List<TaskItem> tasks,
        Period period)
    {
        // Task được hoàn thành trong kỳ
        var completed = tasks.Where(t =>
            IsCompleted(t) &&
            InPeriod(t.CompletedAt, period)
        ).ToList();

        // Task có hạn chót trong kỳ
        var dueInPeriod = tasks.Where(t =>
            InPeriod(t.DueDate, period) &&
            !IsCancelled(t)
        ).ToList();

        // Task đến hạn trong kỳ và đã hoàn thành
        int completedDueInPeriod =
            dueInPeriod.Count(IsCompleted);

        // Các Task hoàn thành trong kỳ có hạn chót
        var withDueDate = completed.Where(t =>
            t.DueDate.HasValue
        ).ToList();

        // Hoàn thành đúng hạn
        int onTime = withDueDate.Count(t =>
        {
            return ToVietnamDate(t.CompletedAt!.Value)
                <= ToVietnamDate(t.DueDate!.Value);
        });

        double completionRate =
            dueInPeriod.Count == 0
                ? 0
                : Math.Round(
                    completedDueInPeriod * 100.0 /
                    dueInPeriod.Count,
                    2);

        double onTimeRate =
            withDueDate.Count == 0
                ? 0
                : Math.Round(
                    onTime * 100.0 /
                    withDueDate.Count,
                    2);

        return new Stats(
            completed.Count,
            completionRate,
            onTime,
            onTimeRate);
    }

    // ==========================================
    // 5. TÍNH TREND
    // ==========================================

    private static AnalyticsTrendDto CountTrend(
        int current,
        int previous)
    {
        if (current == previous)
        {
            return new AnalyticsTrendDto
            {
                Delta = "No change vs previous",
                Up = true
            };
        }

        if (previous == 0)
        {
            return new AnalyticsTrendDto
            {
                Delta = $"+{current} vs previous",
                Up = current > 0
            };
        }

        int change = (int)Math.Round(
            (current - previous) * 100.0 / previous,
            MidpointRounding.AwayFromZero);

        return new AnalyticsTrendDto
        {
            Delta = $"{(change > 0 ? "+" : "")}{change}% vs previous",
            Up = change > 0
        };
    }

    private static AnalyticsTrendDto PercentageTrend(
        double current,
        double previous)
    {
        double change = current - previous;

        return new AnalyticsTrendDto
        {
            Delta = $"{(change > 0 ? "+" : "")}{change:0.##} pp vs previous",
            Up = change >= 0
        };
    }

        private static TimeSpan? ParseTaskTime(object? value)
        {
            if (value == null)
                return null;

            if (value is TimeSpan span)
                return span;

            if (value is DateTime dateTime)
                return dateTime.TimeOfDay;

            var raw = Convert.ToString(
                value,
                CultureInfo.InvariantCulture
            );

            if (string.IsNullOrWhiteSpace(raw))
                return null;

            if (TimeSpan.TryParse(
                raw,
                CultureInfo.InvariantCulture,
                out var parsedSpan))
            {
                return parsedSpan;
            }

            if (DateTime.TryParse(
                raw,
                CultureInfo.GetCultureInfo("en-US"),
                DateTimeStyles.None,
                out var parsedDate))
            {
                return parsedDate.TimeOfDay;
            }

            return null;
        }

    // ==========================================
    // 6. ACTIVITY CHART
    // ==========================================
        private static DateTime AsUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(
                value,
                DateTimeKind.Utc
            )
        };
    }
    private static int GetScheduledMinutes(TaskItem task)
{
    if (!task.StartTime.HasValue ||
        !task.EndTime.HasValue)
    {
        return 0;
    }

    var start = AsUtc(task.StartTime.Value);
    var end = AsUtc(task.EndTime.Value);

    var minutes = (end - start).TotalMinutes;

    if (minutes <= 0)
        return 0;

    return (int)Math.Min(
        int.MaxValue,
        Math.Round(
            minutes,
            MidpointRounding.AwayFromZero
        )
    );
}

// Số phút nhấn Completed trước EndTime
private static int GetEarlyMinutes(TaskItem task)
{
    if (!task.CompletedAt.HasValue ||
        !task.EndTime.HasValue)
    {
        return 0;
    }

    var completed = AsUtc(task.CompletedAt.Value);
    var deadline = AsUtc(task.EndTime.Value);

    var minutes = (deadline - completed).TotalMinutes;

    if (minutes <= 0)
        return 0;

    return (int)Math.Min(
        int.MaxValue,
        Math.Round(
            minutes,
            MidpointRounding.AwayFromZero
        )
    );
}

// Số phút nhấn Completed sau EndTime

private const int LongOverdueThresholdHours = 24;

private const int MaxLateDisplayMinutes =
    LongOverdueThresholdHours * 60;

private static double? GetLatenessMinutes(TaskItem task)
{
    if (!task.EndTime.HasValue ||
        !task.CompletedAt.HasValue)
    {
        return null;
    }

    var deadline = AsUtc(task.EndTime.Value);
    var completed = AsUtc(task.CompletedAt.Value);

    return Math.Max(
        0,
        (completed - deadline).TotalMinutes
    );
}


private static int GetLateMinutes(TaskItem task)
{
    if (!IsCompleted(task))
        return 0;

    var minutes = GetLatenessMinutes(task);

    if (!minutes.HasValue || minutes.Value <= 0)
        return 0;

    // Task trễ trên 24 giờ:
    // Không cộng vào biểu đồ Minutes.
    // Được thống kê riêng trong Completed Very Late.
    if (minutes.Value > MaxLateDisplayMinutes)
        return 0;

    return (int)Math.Round(
        minutes.Value,
        MidpointRounding.AwayFromZero
    );
}


private static bool IsCompletedVeryLate(TaskItem task)
{
    var minutes = GetLatenessMinutes(task);

    return IsCompleted(task) &&
           minutes.HasValue &&
           minutes.Value > MaxLateDisplayMinutes;
}

private static bool IsLongOverdue(
    TaskItem task,
    DateTime nowUtc)
{
    if (IsCompleted(task) || IsCancelled(task))
        return false;

    if (!task.EndTime.HasValue)
        return false;

    var deadline = AsUtc(task.EndTime.Value);

    return nowUtc - deadline >
       TimeSpan.FromHours(LongOverdueThresholdHours);
}

    public async Task<AnalyticsActivityDto>
        GetPersonalActivityAsync(
            string userId,
            string range)
    {
        var tasks = await GetPersonalTasksAsync(userId);

        var today = ToVietnamDate(DateTime.UtcNow);
        var period = GetPeriod(range, today);

        var result = new List<AnalyticsActivityPointDto>();

        // Tạo các mốc thời gian trên biểu đồ
        var buckets = new List<DateTime>();

        if (range == "year")
        {
            for (int month = 1; month <= 12; month++)
            {
                buckets.Add(new DateTime(
                    period.Start.Year,
                    month,
                    1));
            }
        }
        else
        {
            int days = range == "week"
                ? 7
                : DateTime.DaysInMonth(
                    period.Start.Year,
                    period.Start.Month);

            for (int i = 0; i < days; i++)
            {
                buckets.Add(period.Start.AddDays(i));
            }
        }

        var completedTasks = tasks.Where(t =>
            IsCompleted(t) &&
            InPeriod(t.CompletedAt, period)
        ).ToList();

        foreach (var bucket in buckets)
        {
            var dailyTasks = completedTasks.Where(t =>
            {
                var completionDate =
                    ToVietnamDate(t.CompletedAt!.Value);

                if (range == "year")
                {
                    return completionDate.Year == bucket.Year &&
                           completionDate.Month == bucket.Month;
                }

                return completionDate.Date == bucket.Date;
            }).ToList();

            
            
        result.Add(new AnalyticsActivityPointDto
        {
            Date = range == "year"
                ? bucket.ToString("yyyy-MM")
                : bucket.ToString("yyyy-MM-dd"),

            // Số task hoàn thành trong ngày / tháng
            CompletedTasks = dailyTasks.Count,

            // Thời lượng dự kiến
            ScheduledMinutes = dailyTasks.Sum(
                GetScheduledMinutes
            ),

            // Số phút hoàn thành sớm
            EarlyMinutes = dailyTasks.Sum(
                GetEarlyMinutes
            ),

            // Số phút hoàn thành muộn
            LateMinutes = dailyTasks.Sum(
                GetLateMinutes
            ),

            // Giữ dữ liệu actual cũ để không làm hỏng API
            ActualMinutes = dailyTasks.Sum(
                t => Math.Max(0, t.ActualMinutes)
            )
        });


        }

        return new AnalyticsActivityDto
        {
            Period = range,
            Data = result
        };
    }

    // ==========================================
    // 7. TASK DISTRIBUTION
    // ==========================================

    public async Task<AnalyticsDistributionDto>
        GetPersonalDistributionAsync(
            string userId,
            string range)
    {
        var tasks = await GetPersonalTasksAsync(userId);

        var period = GetPeriod(
            range,
            ToVietnamDate(DateTime.UtcNow));

        // Phân bố các Task có hạn chót trong kỳ
        var filtered = tasks.Where(t =>
            InPeriod(t.DueDate, period)
        ).ToList();

        
        int completed = filtered.Count(IsCompleted);

        // Các task cá nhân chưa hoàn thành, chưa hủy
        int todo = filtered.Count(t =>
            !IsCompleted(t) && !IsCancelled(t));

        // Task đã hủy được giữ riêng để không
        // làm sai tổng số và tỷ lệ thống kê.
        int cancelled = filtered.Count(IsCancelled);


        return new AnalyticsDistributionDto
        {
            Period = range,
            Total = filtered.Count,
            Todo = todo,
            Completed = completed,
            Cancelled = cancelled
        };
    }

    // ==========================================
    // 8. SUMMARY
    // ==========================================

    public async Task<AnalyticsSummaryDto>
        GetPersonalSummaryAsync(
            string userId,
            string range)
    {
        var tasks = await GetPersonalTasksAsync(userId);

        var today = ToVietnamDate(DateTime.UtcNow);
        var period = GetPeriod(range, today);

        var dueTasks = tasks.Where(t =>
            InPeriod(t.DueDate, period)
        ).ToList();

        var completedInPeriod = tasks.Where(t =>
            IsCompleted(t) &&
            InPeriod(t.CompletedAt, period)
        ).ToList();

        int total = dueTasks.Count;

        int completed = dueTasks.Count(IsCompleted);

        int pending = dueTasks.Count(t =>
            t.Status.Equals(
                "Todo",
                StringComparison.OrdinalIgnoreCase) ||
            t.Status.Equals(
                "InProgress",
                StringComparison.OrdinalIgnoreCase));

        int overdue = dueTasks.Count(t =>
            !IsCompleted(t) &&
            !IsCancelled(t) &&
            t.DueDate.HasValue &&
            ToVietnamDate(t.DueDate.Value) < today);

        int totalActualMinutes = completedInPeriod.Sum(
            t => Math.Max(0, t.ActualMinutes));

        double averageMinutes =
            completedInPeriod.Count == 0
                ? 0
                : Math.Round(
                    totalActualMinutes * 1.0 /
                    completedInPeriod.Count,
                    2);

        var withDueDate = completedInPeriod.Where(t =>
            t.DueDate.HasValue).ToList();

        int onTime = withDueDate.Count(t =>
            ToVietnamDate(t.CompletedAt!.Value) <=
            ToVietnamDate(t.DueDate!.Value));

        double onTimeRate =
            withDueDate.Count == 0
                ? 0
                : Math.Round(
                    onTime * 100.0 / withDueDate.Count,
                    2);

        
        var productiveDay = completedInPeriod
            .Where(t => t.CompletedAt.HasValue)
            .GroupBy(t =>
                ToVietnamDate(t.CompletedAt!.Value))
            .Select(g => new
            {
                Date = g.Key,

                CompletedCount = g.Count(),

                Minutes = g.Sum(t =>
                    Math.Max(0, t.ActualMinutes))
            })
            // Ưu tiên số task hoàn thành
            .OrderByDescending(g => g.CompletedCount)

            // Nếu bằng nhau, xét thời gian làm việc
            .ThenByDescending(g => g.Minutes)

            // Nếu vẫn bằng nhau, lấy ngày gần nhất
            .ThenByDescending(g => g.Date)
            .FirstOrDefault();

        // Đếm trên toàn bộ Personal Tasks để không bỏ sót
        // những task quá hạn từ các tuần hoặc tháng trước.
        var nowUtc = DateTime.UtcNow;

        int longOverdueTasks = tasks.Count(t =>
            IsLongOverdue(t, nowUtc)
        );

        int completedVeryLateTasks = completedInPeriod.Count(
            IsCompletedVeryLate
        );

        return new AnalyticsSummaryDto
        {
            Period = range,

            TotalTasks = total,
            CompletedTasks = completed,
            PendingTasks = pending,
            OverdueTasks = overdue,

            TotalActualMinutes = totalActualMinutes,
            AverageActualMinutes = averageMinutes,

            MostProductiveDate = productiveDay?.Date.ToString("yyyy-MM-dd"),

            MostProductiveMinutes = productiveDay?.Minutes ?? 0,

            OnTimeRate = onTimeRate,
            LongOverdueTasks = longOverdueTasks,
            CompletedVeryLateTasks = completedVeryLateTasks
        };
    }

    // ==========================================
    // 9. INTERNAL DATA STRUCTURES
    // ==========================================

    private record Period(
        DateTime Start,
        DateTime End);

    private record Stats(
        int Completed,
        double CompletionRate,
        int OnTime,
        double OnTimeRate);
}
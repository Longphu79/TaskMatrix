namespace TaskMatrix.Api.DTOs.Analytics;

// 3. Dữ liệu biểu đồ hoạt động
public class AnalyticsActivityDto
{
    public string Period { get; set; } = "week";

    public List<AnalyticsActivityPointDto> Data { get; set; } = new();
}

public class AnalyticsActivityPointDto
{
    public string Date { get; set; } = "";

    public int CompletedTasks { get; set; }

    public int ActualMinutes { get; set; }
    public int ScheduledMinutes { get; set; }
    public int EarlyMinutes { get; set; }
    public int LateMinutes { get; set; }
}

// 4. Phân bố trạng thái Task
public class AnalyticsDistributionDto
{
    public string Period { get; set; } = "week";

    public int Total { get; set; }
    public int Todo { get; set; }
    public int Completed { get; set; }
    public int Cancelled { get; set; }
}

// 5. Tổng kết
public class AnalyticsSummaryDto
{
    public string Period { get; set; } = "week";

    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int PendingTasks { get; set; }
    public int OverdueTasks { get; set; }

    public int TotalActualMinutes { get; set; }
    public double AverageActualMinutes { get; set; }

    public string? MostProductiveDate { get; set; }
    public int MostProductiveMinutes { get; set; }

    public double OnTimeRate { get; set; }
    public int LongOverdueTasks { get; set; }
    public int CompletedVeryLateTasks { get; set; }
}
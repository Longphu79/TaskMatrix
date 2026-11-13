namespace TaskMatrix.Api.DTOs.Analytics;

public class AnalyticsOverviewDto
{
    public string Period { get; set; } = "Week";

    public int CompletedTasks { get; set; }
    public double CompletionRate { get; set; }

    public int CompletedOnTime { get; set; }
    public double OnTimeRate { get; set; }

    public AnalyticsTrendDto CompletedTrend { get; set; } = new();
    public AnalyticsTrendDto CompletionRateTrend { get; set; } = new();
    public AnalyticsTrendDto OnTimeTrend { get; set; } = new();
}

public class AnalyticsTrendDto
{
    public string Delta { get; set; } = "";
    public bool Up { get; set; }
}

namespace TaskMatrix.Api.DTO.Report;

public sealed class ReportExportRequest
{
    public string ReportType { get; set; } = "attendance";
    public string Format { get; set; } = "PDF";
    public string? Project { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
}

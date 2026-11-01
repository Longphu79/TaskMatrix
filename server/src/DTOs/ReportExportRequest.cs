namespace TaskMatrix.Api.DTOs;

public class ReportExportRequest
{
    public string ReportType { get; set; } = "attendance";
    public string Format { get; set; } = "PDF";
    public string? Project { get; set; }
    public string? Member { get; set; }
    public string? WorkspaceId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
}

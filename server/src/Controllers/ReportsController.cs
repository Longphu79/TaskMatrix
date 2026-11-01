using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;

    public ReportsController(ReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost("export")]
    public async Task<IActionResult> Export([FromBody] ReportExportRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "User identity is missing." });
        }

        if (request.FromDate.Date > request.ToDate.Date)
        {
            return BadRequest(new { message = "FromDate must be on or before ToDate." });
        }

        if (!ReportService.IsSupportedFormat(request.Format))
        {
            return BadRequest(new { message = "Format must be PDF or CSV." });
        }

        if (!ReportService.IsSupportedType(request.ReportType))
        {
            return BadRequest(new { message = "Unsupported report type." });
        }

        var report = await _reportService.CreateExportAsync(userId, request);
        var contentType = request.Format.Equals("PDF", StringComparison.OrdinalIgnoreCase)
            ? "application/pdf"
            : "text/csv; charset=utf-8";

        return File(report.Content, contentType, report.FileName);
    }
}

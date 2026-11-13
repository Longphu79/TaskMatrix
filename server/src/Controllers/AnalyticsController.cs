using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly AnalyticsService _analyticsService;

    public AnalyticsController(
        AnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    private string? CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    private static bool IsValidRange(string range)
    {
        return new[] { "week", "month", "year" }
            .Contains(range);
    }

    // GET: api/analytics/personal/overview?range=week
    [HttpGet("personal/overview")]
    public async Task<IActionResult> GetOverview(
        [FromQuery] string range = "week")
    {
        range = range.ToLowerInvariant();

        if (!IsValidRange(range))
            return BadRequest(new
            {
                message = "Range must be week, month or year"
            });

        if (string.IsNullOrWhiteSpace(CurrentUserId))
            return Unauthorized();

        var result =
            await _analyticsService.GetPersonalOverviewAsync(
                CurrentUserId,
                range);

        return Ok(result);
    }

    // GET: api/analytics/personal/activity?range=week
    [HttpGet("personal/activity")]
    public async Task<IActionResult> GetActivity(
        [FromQuery] string range = "week")
    {
        range = range.ToLowerInvariant();

        if (!IsValidRange(range))
            return BadRequest(new
            {
                message = "Range must be week, month or year"
            });

        if (string.IsNullOrWhiteSpace(CurrentUserId))
            return Unauthorized();

        var result =
            await _analyticsService.GetPersonalActivityAsync(
                CurrentUserId,
                range);

        return Ok(result);
    }

    // GET: api/analytics/personal/distribution?range=week
    [HttpGet("personal/distribution")]
    public async Task<IActionResult> GetDistribution(
        [FromQuery] string range = "week")
    {
        range = range.ToLowerInvariant();

        if (!IsValidRange(range))
            return BadRequest(new
            {
                message = "Range must be week, month or year"
            });

        if (string.IsNullOrWhiteSpace(CurrentUserId))
            return Unauthorized();

        var result =
            await _analyticsService.GetPersonalDistributionAsync(
                CurrentUserId,
                range);

        return Ok(result);
    }

    // GET: api/analytics/personal/summary?range=week
    [HttpGet("personal/summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] string range = "week")
    {
        range = range.ToLowerInvariant();

        if (!IsValidRange(range))
            return BadRequest(new
            {
                message = "Range must be week, month or year"
            });

        if (string.IsNullOrWhiteSpace(CurrentUserId))
            return Unauthorized();

        var result =
            await _analyticsService.GetPersonalSummaryAsync(
                CurrentUserId,
                range);

        return Ok(result);
    }
}
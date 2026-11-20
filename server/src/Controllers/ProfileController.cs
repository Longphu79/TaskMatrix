using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class ProfileController : ControllerBase
{
    private readonly ProfileService _profileService;

    public ProfileController(ProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var profile = await _profileService.GetAsync(userId);
        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPut("me")]
    [RequestSizeLimit(2_100_000)]
    public async Task<ActionResult<ProfileResponse>> UpdateMyProfile(
        [FromBody] UpdateProfileRequest request
    )
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        if (request.Avatar is not null &&
            !request.Avatar.StartsWith("data:image/jpeg;base64,", StringComparison.Ordinal))
        {
            return BadRequest(new { message = "Profile photo must be a JPEG data URL." });
        }

        if (request.Goals.Count > 20 || request.Goals.Any(goal => goal?.Length > 160))
        {
            return BadRequest(new { message = "Profiles can have up to 20 goals, each no longer than 160 characters." });
        }

        var profile = await _profileService.UpdateAsync(userId, request);
        return profile is null ? NotFound() : Ok(profile);
    }
}

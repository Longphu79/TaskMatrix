using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskMatrix.Api.DTOs.Profile;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly UserService _userService;

    public ProfileController(
        UserService userService)
    {
        _userService = userService;
    }


    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>>
        GetMyProfile()
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user =
            await _userService.GetByIdAsync(userId);

        if (user == null)
        {
            return NotFound();
        }

        var response = new ProfileResponse
        {
            UserId = user.Id!,
            FullName = user.FullName,
            Email = user.Email,
            Occupation = user.Occupation,
            Goals = user.Goals,
            FreeTime = user.FreeTime
        };

        return Ok(response);
    }

    [HttpPut("me")]
    public async Task<ActionResult<ProfileResponse>>UpdateMyProfile(UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _userService.GetByIdAsync(userId);
        if (user == null) {
            return NotFound();
        }
        var fullName = string.IsNullOrWhiteSpace(request.FullName) ? user.FullName : request.FullName.Trim();
        await _userService.UpdateProfileAsync(userId, fullName, request.Occupation?.Trim(), request.Goals, request.FreeTime?.Trim());
        var updatedUser =
        await _userService.GetByIdAsync(userId);
        var response = new ProfileResponse
        {
            UserId = updatedUser!.Id!,
            FullName = updatedUser.FullName,
            Email = updatedUser.Email,
            Occupation = updatedUser.Occupation,
            Goals = updatedUser.Goals,
            FreeTime = updatedUser.FreeTime
        };

        return Ok(response);
    }
}
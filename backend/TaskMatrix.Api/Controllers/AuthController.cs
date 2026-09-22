using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.DTOs.Auth;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(
        AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>>
    Register(RegisterRequest request)
    {
        try
        {
            var result =
                await _authService.RegisterAsync(request);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>>
        Login(LoginRequest request)
    {
        var result =
            await _authService.LoginAsync(request);

        if (result == null)
        {
            return Unauthorized(new
            {
                message =
                    "Invalid email or password."
            });
        }

        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        var email = User.FindFirstValue(
            ClaimTypes.Email);

        var role = User.FindFirstValue(
            ClaimTypes.Role);

        return Ok(new
        {
            userId,
            email,
            role
        });
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>>
    GoogleLogin(GoogleLoginRequest request)
    {
        try
        {
            var result =
                await _authService
                    .GoogleLoginAsync(request);

            return Ok(result);
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new
            {
                message =
                    "Invalid Google token."
            });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }

}
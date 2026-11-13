
using Microsoft.AspNetCore.Mvc;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        AuthService authService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    // 1. Register
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request)
    {
        try
        {
            var result =
                await _authService.RegisterAsync(request);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // 2. Login
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        var result =
            await _authService.LoginAsync(request);

        if (result == null)
        {
            return Unauthorized(new
            {
                message = "Email or password is incorrect."
            });
        }

        return Ok(result);
    }

    // 3. Google Login
    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin(
        [FromBody] GoogleLoginRequest request)
    {
        try
        {
            var result =
                await _authService.GoogleLoginAsync(request);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Google login failed."
            );

            return BadRequest(new
            {
                message = "Google login could not be completed."
            });
        }
    }

    // 4. Forgot Password
    // POST: api/Auth/forgot-password
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request)
    {
        try
        {
            await _authService.ForgotPasswordAsync(
                request.Email
            );

            // Không tiết lộ email có tồn tại hay không
            return Ok(new
            {
                message =
                    "If an account with that email exists, " +
                    "a password reset link has been sent."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Forgot password request failed."
            );

            return StatusCode(500, new
            {
                message =
                    "Unable to process your request right now."
            });
        }
    }

    // 5. Reset Password
    // POST: api/Auth/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request)
    {
        try
        {
            bool success =
                await _authService.ResetPasswordAsync(
                    request.Email,
                    request.Token,
                    request.NewPassword
                );

            if (!success)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid or expired password reset link."
                });
            }

            return Ok(new
            {
                message =
                    "Password has been reset successfully. " +
                    "You can now sign in with your new password."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Password reset failed."
            );

            return StatusCode(500, new
            {
                message =
                    "Unable to reset password right now."
            });
        }
    }
}

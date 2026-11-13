
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class AuthService
{
    private readonly UserService _userService;
    private readonly EmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly ILogger<AuthService> _logger;

    private static readonly TimeSpan ResetTokenLifetime =
        TimeSpan.FromMinutes(30);

    public AuthService(
        UserService userService,
        EmailService emailService,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _userService = userService;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;

        _passwordHasher = new PasswordHasher<User>();
    }

    // 1. Đăng ký tài khoản
    public async Task<AuthResponse> RegisterAsync(
        RegisterRequest request)
    {
        string email = request.Email.Trim().ToLowerInvariant();

        var existingUser =
            await _userService.GetByEmailAsync(email);

        if (existingUser != null)
        {
            throw new InvalidOperationException(
                "This email is already registered.");
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Role = "User",
            IsActive = true
        };

        user.PasswordHash = _passwordHasher.HashPassword(
            user,
            request.Password
        );

        await _userService.CreateAsync(user);

        return CreateAuthResponse(user);
    }

    // 2. Đăng nhập Email và Password
    public async Task<AuthResponse?> LoginAsync(
        LoginRequest request)
    {
        string email = request.Email.Trim().ToLowerInvariant();

        var user = await _userService.GetByEmailAsync(email);

        if (user == null ||
            !user.IsActive ||
            string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return null;
        }

        var verificationResult =
            _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password
            );

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return null;
        }

        return CreateAuthResponse(user);
    }

    // 3. Đăng nhập Google
    public async Task<AuthResponse> GoogleLoginAsync(
        GoogleLoginRequest request)
    {
        var clientId = _configuration["GoogleAuth:ClientId"]
            ?? throw new InvalidOperationException(
                "Google Client ID is not configured.");

        var settings =
            new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };

        var payload =
            await GoogleJsonWebSignature.ValidateAsync(
                request.IdToken,
                settings
            );

        var googleSubject = payload.Subject;

        var email = payload.Email?
            .Trim()
            .ToLowerInvariant();

        var fullName = payload.Name?.Trim();

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidOperationException(
                "Google email is required.");
        }

        // A. Tài khoản Google đã tồn tại
        var googleUser =
            await _userService.GetByGoogleSubjectAsync(
                googleSubject
            );

        if (googleUser != null)
        {
            if (!googleUser.IsActive)
            {
                throw new InvalidOperationException(
                    "This account is disabled.");
            }

            return CreateAuthResponse(googleUser);
        }

        // B. Email đã tồn tại
        var existingUser =
            await _userService.GetByEmailAsync(email);

        if (existingUser != null)
        {
            throw new InvalidOperationException(
                "This email is already registered. " +
                "Please login with your existing account.");
        }

        // C. Tạo tài khoản Google mới
        var user = new User
        {
            FullName = string.IsNullOrWhiteSpace(fullName)
                ? email
                : fullName,

            Email = email,
            GoogleSubject = googleSubject,
            PasswordHash = null,
            Role = "User",
            IsActive = true
        };

        await _userService.CreateAsync(user);

        return CreateAuthResponse(user);
    }

    // 4. Yêu cầu khôi phục mật khẩu
    public async Task ForgotPasswordAsync(string email)
    {
        email = email.Trim().ToLowerInvariant();

        var user = await _userService.GetByEmailAsync(email);

        // Không tiết lộ email có tồn tại hay không
        if (user == null || !user.IsActive)
            return;

        // Tạo token ngẫu nhiên 256 bit
        byte[] tokenBytes = RandomNumberGenerator.GetBytes(32);

        string rawToken = WebEncoders.Base64UrlEncode(
            tokenBytes
        );

        // Chỉ lưu SHA-256 hash vào MongoDB
        string tokenHash = HashResetToken(rawToken);

        DateTime expiry = DateTime.UtcNow.Add(
            ResetTokenLifetime
        );

        bool saved =
            await _userService.SavePasswordResetTokenAsync(
                user.Id!,
                tokenHash,
                expiry
            );

        if (!saved)
        {
            _logger.LogError(
                "Could not save password reset token for user {UserId}",
                user.Id
            );

            return;
        }

        // Tạo đường dẫn Reset Password
        var frontendUrl =
            _configuration["Frontend:BaseUrl"];

        if (string.IsNullOrWhiteSpace(frontendUrl))
        {
            await _userService.ClearPasswordResetTokenAsync(
                user.Id!
            );

            throw new InvalidOperationException(
                "Frontend BaseUrl is not configured.");
        }

        frontendUrl = frontendUrl.TrimEnd('/');

        string resetLink =
            $"{frontendUrl}/reset-password" +
            $"?email={Uri.EscapeDataString(email)}" +
            $"&token={Uri.EscapeDataString(rawToken)}";

        try
        {
            await _emailService.SendPasswordResetEmailAsync(
                user.Email,
                user.FullName,
                resetLink
            );
        }
        catch (Exception ex)
        {
            // Không để token không được gửi đi tồn tại trong DB
            await _userService.ClearPasswordResetTokenAsync(
                user.Id!
            );

            _logger.LogError(
                ex,
                "Failed to send password reset email to user {UserId}",
                user.Id
            );

            // Không tiết lộ lỗi SMTP hoặc sự tồn tại của email
            return;
        }
    }

    // 5. Đặt lại mật khẩu
    public async Task<bool> ResetPasswordAsync(
        string email,
        string token,
        string newPassword)
    {
        email = email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(token) ||
            string.IsNullOrWhiteSpace(newPassword))
        {
            return false;
        }

        var user = await _userService.GetByEmailAsync(email);

        if (user == null || !user.IsActive)
            return false;

        // Hash token người dùng gửi lên
        string tokenHash = HashResetToken(token);

        // Xác thực token trước khi đổi mật khẩu
        var validUser =
            await _userService.GetByValidPasswordResetTokenAsync(
                tokenHash,
                DateTime.UtcNow
            );

        if (validUser == null ||
            validUser.Id != user.Id)
        {
            return false;
        }

        // Hash mật khẩu mới
        string newPasswordHash =
            _passwordHasher.HashPassword(
                user,
                newPassword
            );

        // Cập nhật mật khẩu và xóa token
        // Trong cùng một thao tác MongoDB có điều kiện
        return await _userService.ResetPasswordAsync(
            tokenHash,
            newPasswordHash,
            DateTime.UtcNow
        );
    }

    // 6. Hash Reset Token bằng SHA-256
    private static string HashResetToken(string token)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(token);

        byte[] hash = SHA256.HashData(bytes);

        return Convert.ToHexString(hash);
    }

    // 7. Tạo AuthResponse
    private AuthResponse CreateAuthResponse(User user)
    {
        return new AuthResponse(
            Token: GenerateJwtToken(user),
            UserId: user.Id!,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role
        );
    }

    // 8. Sinh JWT Token
    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException(
                "JWT Key is not configured.");

        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id!),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

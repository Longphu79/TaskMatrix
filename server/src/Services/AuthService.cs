using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class AuthService
{
    private readonly UserService _userService;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _passwordHasher;

    public AuthService(UserService userService, IConfiguration configuration)
    {
        _userService = userService;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<User>();
    }

    // 1. Logic Đăng ký tài khoản
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        string email = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _userService.GetByEmailAsync(email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("this email is already registered.");
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Role = "User",
            IsActive = true
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        await _userService.CreateAsync(user);

        return CreateAuthResponse(user);
    }

    // 2. Logic Đăng nhập bằng Email & Mật khẩu
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        string email = request.Email.Trim().ToLowerInvariant();
        var user = await _userService.GetByEmailAsync(email);

        if (user == null || !user.IsActive || string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return null;
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return null;
        }

        return CreateAuthResponse(user);
    }

    // 3. Logic Đăng nhập bằng Google (Gmail)
    public async Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest request)
    {
        var clientId = _configuration["GoogleAuth:ClientId"]
            ?? throw new InvalidOperationException("Chưa cấu hình Google Client ID.");

        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { clientId }
        };

        // Xác thực IdToken gửi từ Google FE
        var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        var googleSubject = payload.Subject;
        var email = payload.Email?.Trim().ToLowerInvariant();
        var fullName = payload.Name?.Trim();

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidOperationException("gmail is required for Google login.");
        }

        // Trường hợp A: Đã từng đăng nhập bằng Google trước đó
        var googleUser = await _userService.GetByGoogleSubjectAsync(googleSubject);
        if (googleUser != null)
        {
            if (!googleUser.IsActive)
                throw new InvalidOperationException("this account is disabled.");

            return CreateAuthResponse(googleUser);
        }

        // Trường hợp B: Email đã tồn tại dưới dạng tài khoản thường
        var existingUser = await _userService.GetByEmailAsync(email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("this email is already registered. Please login with your password or use a different Google account.");
        }

        // Trường hợp C: Lần đầu đăng nhập bằng Google -> Tự động tạo User mới
        var user = new User
        {
            FullName = string.IsNullOrWhiteSpace(fullName) ? email : fullName,
            Email = email,
            GoogleSubject = googleSubject,
            PasswordHash = null, // Đăng nhập Google không có Password
            Role = "User",
            IsActive = true
        };

        await _userService.CreateAsync(user);
        return CreateAuthResponse(user);
    }

    // Tạo đối tượng AuthResponse trả về cho Client
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

    // Hàm sinh JWT Token
    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("No JWT key configured.");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id!),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
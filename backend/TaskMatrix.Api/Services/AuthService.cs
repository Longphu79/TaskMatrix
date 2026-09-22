using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TaskMatrix.Api.DTOs.Auth;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services
{
    public class AuthService
    {
        private readonly UserService _userService;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<User> _passwordHasher;

        public AuthService(
            UserService userService,
            IConfiguration configuration)
        {
            _userService = userService;
            _configuration = configuration;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
        string email = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _userService.GetByEmailAsync(email);
            if (existingUser != null) 
            { 
                throw new InvalidOperationException("Email is already registered.");
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

        public async Task<AuthResponse?> LoginAsync(LoginRequest request)
        {
            string email =
                request.Email
                    .Trim()
                    .ToLowerInvariant();

            var user =
                await _userService.GetByEmailAsync(email);

            if (user == null ||
                !user.IsActive ||
                string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                return null;
            }

            var result =
                _passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return null;
            }

            return CreateAuthResponse(user);
        }

        private AuthResponse CreateAuthResponse(User user)
        {
            return new AuthResponse
            {
                Token = GenerateJwtToken(user),
                UserId = user.Id!,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role
            };
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException(
                    "JWT key is not configured.");

            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            var claims = new[]
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.Id!),

                new Claim(
                    ClaimTypes.Email,
                    user.Email),

                new Claim(
                    ClaimTypes.Role,
                    user.Role)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
        public async Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest request)
        {
            var clientId =
                _configuration["GoogleAuth:ClientId"]
                ?? throw new InvalidOperationException(
                    "Google Client ID is not configured.");

            var settings =
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[]
                    {
                clientId
                    }
                };

            var payload =
                await GoogleJsonWebSignature.ValidateAsync(
                    request.IdToken,
                    settings);

            var googleSubject = payload.Subject;

            var email =
                payload.Email?
                    .Trim()
                    .ToLowerInvariant();

            var fullName =
                payload.Name?.Trim();

            if (string.IsNullOrWhiteSpace(email))
            {
                throw new InvalidOperationException(
                    "Google account does not provide an email.");
            }
            var googleUser =
                await _userService
                    .GetByGoogleSubjectAsync(
                        googleSubject);

            if (googleUser != null)
            {
                if (!googleUser.IsActive)
                {
                    throw new InvalidOperationException(
                        "Account is inactive.");
                }

                return CreateAuthResponse(
                    googleUser);
            }
            var existingUser =
                await _userService
                    .GetByEmailAsync(email);

            if (existingUser != null)
            {
                throw new InvalidOperationException(
                    "An account with this email already exists.");
            }
            var user = new User
            {
                FullName =
                    string.IsNullOrWhiteSpace(fullName)
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
    }
}
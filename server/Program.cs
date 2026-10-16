using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using TaskMatrix.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình MongoDB Connection
var mongoConnectionString = builder.Configuration["MongoDbSettings:ConnectionString"];
var mongoDatabaseName = builder.Configuration["MongoDbSettings:DatabaseName"];

builder.Services.AddSingleton<IMongoClient>(sp => new MongoClient(mongoConnectionString));

builder.Services.AddScoped<IMongoDatabase>(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(mongoDatabaseName);
});

// 2. Đăng ký các Business Services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<TaskService>();

// 3. Cấu hình Xác thực JWT (Authentication)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyForTaskMatrixApp2026";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// 4. Cấu hình CORS cho phép React kết nối
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Bỏ/Comment dòng HTTPS Redirection nếu chạy HTTP Local Port 5260 để tránh bị chặn Request
// app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

// Middleware xác thực & phân quyền (Đã đúng thứ tự)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
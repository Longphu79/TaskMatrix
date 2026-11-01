using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using TaskMatrix.Api.Hubs;
using TaskMatrix.Api.Services;
using TaskMatrix.Api.Workers;

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

// 2. Đăng ký các Business Services & Cấu hình HttpClient nâng cao cho AI / Vision
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<TaskService>();
builder.Services.AddSingleton<AiMemoryService>();

// Cấu hình nguyên bản của bạn (Không gán BaseAddress)
builder.Services.AddHttpClient<AiService>(client =>
{
    client.DefaultRequestHeaders.Add("User-Agent", "TaskMatrix/1.0");
    client.Timeout = TimeSpan.FromSeconds(30);
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true
});

builder.Services.AddHttpClient<VisionService>(client =>
{
    client.DefaultRequestHeaders.Add("User-Agent", "TaskMatrix/1.0");
    client.Timeout = TimeSpan.FromSeconds(30);
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true
});

// 3. Cấu hình Xác thực JWT
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

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// 4. Cấu hình CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 5. Đăng ký SignalR & Background Worker
builder.Services.AddSignalR();
builder.Services.AddHostedService<DeadlineReminderWorker>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notification");

app.Run();
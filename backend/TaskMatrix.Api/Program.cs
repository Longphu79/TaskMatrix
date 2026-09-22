using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Text;
using TaskMatrix.Api.Services;
using TaskMatrix.Api.Settings;



var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services
    .AddOptions<MongoDbSettings>()
    .Bind(builder.Configuration.GetSection(MongoDbSettings.SectionName))
    .Validate(
        settings => !string.IsNullOrWhiteSpace(settings.ConnectionString),
        "MongoDB connection string is required.")
    .Validate(
        settings => !string.IsNullOrWhiteSpace(settings.DatabaseName),
        "MongoDB database name is required.")
    .ValidateOnStart();

builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuthService>();
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "JWT key is not configured.");

var jwtIssuer = builder.Configuration["Jwt:Issuer"];

var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)),

                ClockSkew = TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();

builder.Services.AddSingleton<IMongoClient>(serviceProvider =>
{
    var settings = serviceProvider
        .GetRequiredService<IOptions<MongoDbSettings>>()
        .Value;

    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddSingleton<IMongoDatabase>(serviceProvider =>
{
    var settings = serviceProvider
        .GetRequiredService<IOptions<MongoDbSettings>>()
        .Value;

    var mongoClient = serviceProvider.GetRequiredService<IMongoClient>();

    return mongoClient.GetDatabase(settings.DatabaseName);
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var userService =
        scope.ServiceProvider
            .GetRequiredService<UserService>();

    await userService.CreateIndexesAsync();
}


if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();

app.MapControllers();

app.Run();
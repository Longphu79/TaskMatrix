using MongoDB.Driver;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public sealed class ProfileService
{
    private readonly IMongoCollection<User> _users;
    private readonly IMongoCollection<UserProfile> _profiles;

    public ProfileService(IMongoDatabase database)
    {
        _users = database.GetCollection<User>("users");
        _profiles = database.GetCollection<UserProfile>("userProfiles");
    }

    public async Task<ProfileResponse?> GetAsync(string userId)
    {
        var user = await _users.Find(item => item.Id == userId).FirstOrDefaultAsync();
        if (user is null) return null;

        var profile = await _profiles.Find(item => item.UserId == userId).FirstOrDefaultAsync();
        return ToResponse(user, profile);
    }

    public async Task<ProfileResponse?> UpdateAsync(string userId, UpdateProfileRequest request)
    {
        var user = await _users.Find(item => item.Id == userId).FirstOrDefaultAsync();
        if (user is null) return null;

        await _users.UpdateOneAsync(
            item => item.Id == userId,
            Builders<User>.Update.Set(item => item.FullName, request.FullName.Trim())
        );

        var existingProfile = await _profiles.Find(item => item.UserId == userId).FirstOrDefaultAsync();
        var profile = new UserProfile
        {
            Id = existingProfile?.Id ?? MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            UserId = userId,
            Occupation = string.IsNullOrWhiteSpace(request.Occupation) ? null : request.Occupation.Trim(),
            Goals = request.Goals
                .Where(goal => !string.IsNullOrWhiteSpace(goal))
                .Select(goal => goal.Trim())
                .ToList(),
            FreeTime = string.IsNullOrWhiteSpace(request.FreeTime) ? null : request.FreeTime.Trim(),
            Avatar = request.Avatar ?? existingProfile?.Avatar
        };

        await _profiles.ReplaceOneAsync(
            item => item.UserId == userId,
            profile,
            new ReplaceOptions { IsUpsert = true }
        );

        user.FullName = request.FullName.Trim();
        return ToResponse(user, profile);
    }

    private static ProfileResponse ToResponse(User user, UserProfile? profile)
    {
        if (profile is null)
        {
            return new ProfileResponse(
                user.FullName,
                user.Email,
                user.Occupation,
                user.Goals,
                user.FreeTime,
                user.Avatar
            );
        }

        return new ProfileResponse(
            user.FullName,
            user.Email,
            profile.Occupation,
            profile.Goals,
            profile.FreeTime,
            profile.Avatar
        );
    }
}

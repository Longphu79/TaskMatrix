using MongoDB.Driver;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class UserService
{
    private readonly IMongoCollection<User> _users;

    public UserService(IMongoDatabase database)
    {
        _users = database.GetCollection<User>("users");
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        string normalizedEmail = email.Trim().ToLowerInvariant();
        return await _users.Find(u => u.Email == normalizedEmail).FirstOrDefaultAsync();
    }

    public async Task<User?> GetByGoogleSubjectAsync(string googleSubject)
    {
        return await _users.Find(u => u.GoogleSubject == googleSubject).FirstOrDefaultAsync();
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
        {
            return null;
        }

        return await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
    }

    public async Task<bool> UpdateProfileAsync(
        string id,
        string fullName,
        string? occupation,
        List<string> goals,
        string? freeTime)
    {
        if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
        {
            return false;
        }

        var update = Builders<User>.Update
            .Set(user => user.FullName, fullName)
            .Set(user => user.Occupation, occupation)
            .Set(user => user.Goals, goals)
            .Set(user => user.FreeTime, freeTime);

        var result = await _users.UpdateOneAsync(user => user.Id == id, update);
        return result.MatchedCount > 0;
    }

    public async Task CreateAsync(User user)
    {
        await _users.InsertOneAsync(user);
    }
}
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

    public async Task CreateAsync(User user)
    {
        await _users.InsertOneAsync(user);
    }
}
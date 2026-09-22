using MongoDB.Driver;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services
{
    public class UserService
    {
        private readonly IMongoCollection<User> _users;

        public UserService(IMongoDatabase database)
        {
            _users = database.GetCollection<User>("users");
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            string normalizedEmail = email.ToLowerInvariant();
            return await _users
                .Find(x => x.Email == normalizedEmail)
                .FirstOrDefaultAsync();
        }

        public async Task<User?> GetByIdAsync(string id)
        {
            return await _users
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();
        }

        public async Task CreateAsync(User user)
        {
            await _users.InsertOneAsync(user);
        }

        public async Task CreateIndexesAsync()
        {
            var emailIndex = new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(x => x.Email),
                new CreateIndexOptions
                {
                    Unique = true
                });

            await _users.Indexes.CreateOneAsync(emailIndex);
        }
        public async Task UpdateProfileAsync(string id, string fullName, string? occupation, List<string> goal, string? freeTime)
        {
            var update = Builders<User>.Update
                .Set(u => u.FullName, fullName)
                .Set(u => u.Occupation, occupation)
                .Set(u => u.Goals, goal);
            await _users.UpdateOneAsync(u => u.Id == id, update);
        }
        public async Task<User?> GetByGoogleSubjectAsync(string googleSubject)
        {
            return await _users
                .Find(x => x.GoogleSubject == googleSubject)
                .FirstOrDefaultAsync();
        }
    }
}
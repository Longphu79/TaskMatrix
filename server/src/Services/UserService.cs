
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

    // 1. Tạo unique index cho Email
    public async Task EnsureIndexesAsync()
    {
        var indexOptions = new CreateIndexOptions
        {
            Unique = true,
            Name = "uq_users_email"
        };

        var index = new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Email),
            indexOptions
        );

        await _users.Indexes.CreateOneAsync(index);
    }

    // 2. Tìm User theo Email
    public async Task<User?> GetByEmailAsync(string email)
    {
        string normalizedEmail = email.Trim().ToLowerInvariant();

        return await _users.Find(
            u => u.Email == normalizedEmail
        ).FirstOrDefaultAsync();
    }

    // 3. Tìm User theo Google Subject
    public async Task<User?> GetByGoogleSubjectAsync(
        string googleSubject)
    {
        return await _users.Find(
            u => u.GoogleSubject == googleSubject
        ).FirstOrDefaultAsync();
    }

    // 4. Tìm User theo ID
    public async Task<User?> GetByIdAsync(string id)
    {
        if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
            return null;

        return await _users.Find(
            u => u.Id == id
        ).FirstOrDefaultAsync();
    }

    // 5. Tạo User mới
    public async Task CreateAsync(User user)
    {
        user.Email = user.Email.Trim().ToLowerInvariant();

        await _users.InsertOneAsync(user);
    }

    // 6. Cập nhật thông tin User
    public async Task<bool> UpdateAsync(User user)
    {
        if (string.IsNullOrWhiteSpace(user.Id))
            return false;

        var result = await _users.ReplaceOneAsync(
            u => u.Id == user.Id,
            user
        );

        return result.MatchedCount > 0;
    }

    // 7. Lưu Password Reset Token Hash
    public async Task<bool> SavePasswordResetTokenAsync(
        string userId,
        string tokenHash,
        DateTime expiry)
    {
        var filter = Builders<User>.Filter.Eq(
            u => u.Id,
            userId
        );

        var update = Builders<User>.Update
            .Set(u => u.ResetTokenHash, tokenHash)
            .Set(u => u.ResetTokenExpiry, expiry);

        var result = await _users.UpdateOneAsync(
            filter,
            update
        );

        return result.MatchedCount > 0;
    }

    // 8. Tìm User có Reset Token còn hiệu lực
    public async Task<User?> GetByValidPasswordResetTokenAsync(
        string tokenHash,
        DateTime now)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(
                u => u.ResetTokenHash,
                tokenHash
            ),
            Builders<User>.Filter.Gt(
                u => u.ResetTokenExpiry,
                now
            ),
            Builders<User>.Filter.Eq(
                u => u.IsActive,
                true
            )
        );

        return await _users.Find(filter).FirstOrDefaultAsync();
    }

    // 9. Đổi mật khẩu và vô hiệu hóa Token trong một thao tác
    public async Task<bool> ResetPasswordAsync(
        string tokenHash,
        string passwordHash,
        DateTime now)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(
                u => u.ResetTokenHash,
                tokenHash
            ),
            Builders<User>.Filter.Gt(
                u => u.ResetTokenExpiry,
                now
            ),
            Builders<User>.Filter.Eq(
                u => u.IsActive,
                true
            )
        );

        var update = Builders<User>.Update
            .Set(u => u.PasswordHash, passwordHash)
            .Unset(u => u.ResetTokenHash)
            .Unset(u => u.ResetTokenExpiry);

        var result = await _users.UpdateOneAsync(
            filter,
            update
        );

        return result.ModifiedCount > 0;
    }

    // 10. Xóa Token khi cần thiết
    public async Task ClearPasswordResetTokenAsync(
        string userId)
    {
        var filter = Builders<User>.Filter.Eq(
            u => u.Id,
            userId
        );

        var update = Builders<User>.Update
            .Unset(u => u.ResetTokenHash)
            .Unset(u => u.ResetTokenExpiry);

        await _users.UpdateOneAsync(filter, update);
    }
}

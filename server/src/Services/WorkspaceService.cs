using MongoDB.Bson;
using MongoDB.Driver;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class WorkspaceService
{
    private readonly IMongoCollection<Workspace> _workspaces;
    private readonly IMongoCollection<User> _users;

    public WorkspaceService(IMongoDatabase database)
    {
        _workspaces = database.GetCollection<Workspace>("workspaces");
        _users = database.GetCollection<User>("users");
    }

    // 1. Lấy tất cả Workspace mà User thuộc về (Tự động khởi tạo Personal Workspace nếu chưa có)
    public async Task<List<WorkspaceResponse>> GetUserWorkspacesAsync(string userId)
    {
        var userWorkspaces = await _workspaces
            .Find(w => w.Members.Any(m => m.UserId == userId))
            .ToListAsync();

        // Kiểm tra xem User đã có Personal Workspace chưa
        var personalWs = userWorkspaces.FirstOrDefault(w => w.Type == "personal");
        if (personalWs == null)
        {
            var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
            personalWs = new Workspace
            {
                Name = "Personal Workspace",
                Type = "personal",
                OwnerId = userId,
                Members = new List<WorkspaceMember>
                {
                    new WorkspaceMember
                    {
                        UserId = userId,
                        FullName = user?.FullName ?? "Owner",
                        Email = user?.Email ?? "",
                        Role = "Owner"
                    }
                }
            };

            await _workspaces.InsertOneAsync(personalWs);
            userWorkspaces.Insert(0, personalWs);
        }

        // Convert sang DTO trả về cho React Frontend
        return userWorkspaces.Select(w =>
        {
            var memberInfo = w.Members.FirstOrDefault(m => m.UserId == userId);
            return new WorkspaceResponse(
                Id: w.Id!,
                Name: w.Name,
                Type: w.Type,
                Role: memberInfo?.Role ?? "Member",
                JoinCode: w.JoinCode,
                Members: w.Members.Select(m => new WorkspaceMemberDto(
                    UserId: m.UserId,
                    FullName: m.FullName,
                    Email: m.Email,
                    Role: m.Role
                )).ToList()
            );
        }).ToList();
    }

    // 2. Tạo Workspace Công ty / Nhóm mới (Người tạo nhận vai trò Manager)
    public async Task<WorkspaceResponse> CreateCompanyWorkspaceAsync(string userId, string companyName)
    {
        var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();

        var company = new Workspace
        {
            Name = companyName.Trim(),
            Type = "company",
            OwnerId = userId,
            JoinCode = "MX-" + Random.Shared.Next(1000, 9999),
            Members = new List<WorkspaceMember>
            {
                new WorkspaceMember
                {
                    UserId = userId,
                    FullName = user?.FullName ?? "Manager",
                    Email = user?.Email ?? "",
                    Role = "Manager" // Mặc định người tạo là Manager
                }
            }
        };

        await _workspaces.InsertOneAsync(company);

        return new WorkspaceResponse(
            Id: company.Id!,
            Name: company.Name,
            Type: company.Type,
            Role: "Manager",
            JoinCode: company.JoinCode,
            Members: company.Members.Select(m => new WorkspaceMemberDto(m.UserId, m.FullName, m.Email, m.Role)).ToList()
        );
    }

    // 3. Manager thêm thành viên mới vào Nhóm bằng Email
    public async Task<bool> AddMemberByEmailAsync(string workspaceId, string managerUserId, string email, string role)
    {
        var workspace = await _workspaces.Find(w => w.Id == workspaceId).FirstOrDefaultAsync();
        if (workspace == null) throw new KeyNotFoundException("Không tìm thấy Workspace.");

        // Kiểm tra xem người thêm có phải là Manager không
        bool isManager = workspace.Members.Any(m => m.UserId == managerUserId && m.Role == "Manager");
        if (!isManager && workspace.OwnerId != managerUserId)
            throw new UnauthorizedAccessException("Chỉ Manager mới có quyền thêm thành viên.");

        // Tìm User trong DB theo Email
        var targetUser = await _users.Find(u => u.Email.ToLower() == email.Trim().ToLower()).FirstOrDefaultAsync();
        if (targetUser == null)
            throw new InvalidOperationException("Email này chưa đăng ký tài khoản trên hệ thống.");

        // Kiểm tra xem đã trong Workspace chưa
        if (workspace.Members.Any(m => m.UserId == targetUser.Id))
            throw new InvalidOperationException("Thành viên này đã có trong Workspace.");

        var newMember = new WorkspaceMember
        {
            UserId = targetUser.Id!,
            FullName = targetUser.FullName,
            Email = targetUser.Email,
            Role = string.Equals(role, "Manager", StringComparison.OrdinalIgnoreCase) ? "Manager" : "Member"
        };

        var update = Builders<Workspace>.Update.Push(w => w.Members, newMember);
        var result = await _workspaces.UpdateOneAsync(w => w.Id == workspaceId, update);
        return result.ModifiedCount > 0;
    }

    // 4. Manager cập nhật Role thành viên (Thăng chức thành Manager / Hạ xuống Employee)
    public async Task<bool> UpdateMemberRoleAsync(string workspaceId, string managerUserId, string targetUserId, string newRole)
    {
        var workspace = await _workspaces.Find(w => w.Id == workspaceId).FirstOrDefaultAsync();
        if (workspace == null) return false;

        bool isManager = workspace.Members.Any(m => m.UserId == managerUserId && m.Role == "Manager");
        if (!isManager && workspace.OwnerId != managerUserId)
            throw new UnauthorizedAccessException("Chỉ Manager mới có quyền thay đổi vai trò thành viên.");

        var filter = Builders<Workspace>.Filter.And(
            Builders<Workspace>.Filter.Eq(w => w.Id, workspaceId),
            Builders<Workspace>.Filter.Eq("members.userId", targetUserId)
        );

        var update = Builders<Workspace>.Update.Set("members.$.role", newRole);
        var result = await _workspaces.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }

    // 5. Manager xóa thành viên khỏi Workspace
    public async Task<bool> RemoveMemberAsync(string workspaceId, string managerUserId, string memberUserId)
    {
        var workspace = await _workspaces.Find(w => w.Id == workspaceId).FirstOrDefaultAsync();
        if (workspace == null) return false;

        bool isManager = workspace.Members.Any(m => m.UserId == managerUserId && m.Role == "Manager");
        if (!isManager && workspace.OwnerId != managerUserId)
            throw new UnauthorizedAccessException("Chỉ Manager mới có quyền xóa thành viên.");

        var update = Builders<Workspace>.Update.PullFilter(w => w.Members, m => m.UserId == memberUserId);
        var result = await _workspaces.UpdateOneAsync(w => w.Id == workspaceId, update);
        return result.ModifiedCount > 0;
    }

    // Thêm hàm Tham gia công ty bằng Mã JoinCode
    public async Task<WorkspaceResponse> JoinCompanyByCodeAsync(string userId, string joinCode)
    {
        var workspace = await _workspaces.Find(w => w.JoinCode == joinCode.Trim().ToUpper()).FirstOrDefaultAsync();
        if (workspace == null) throw new KeyNotFoundException("Mã tham gia không chính xác hoặc không tồn tại.");

        if (workspace.Members.Any(m => m.UserId == userId))
            throw new InvalidOperationException("Bạn đã là thành viên của Workspace này.");

        var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        var newMember = new WorkspaceMember
        {
            UserId = userId,
            FullName = user?.FullName ?? "Member",
            Email = user?.Email ?? "",
            Role = "Member" // Thành viên tham gia mặc định mang role Member
        };

        var update = Builders<Workspace>.Update.Push(w => w.Members, newMember);
        await _workspaces.UpdateOneAsync(w => w.Id == workspace.Id, update);

        return new WorkspaceResponse(
            Id: workspace.Id!,
            Name: workspace.Name,
            Type: workspace.Type,
            Role: "Member", // Khi tham gia, role mặc định là Member
            JoinCode: workspace.JoinCode,
            Members: workspace.Members.Concat(new[] { newMember }).Select(m => new WorkspaceMemberDto(m.UserId, m.FullName, m.Email, m.Role)).ToList()
        );
    }


    public async Task<bool> LeaveWorkspaceAsync(string workspaceId, string userId)
    {
        var workspace = await _workspaces.Find(w => w.Id == workspaceId).FirstOrDefaultAsync();
        if (workspace == null)
            throw new KeyNotFoundException("Không tìm thấy Workspace.");

        if (workspace.Type == "personal")
            throw new InvalidOperationException("Không thể rời khỏi Workspace cá nhân.");

        var member = workspace.Members.FirstOrDefault(m => m.UserId == userId);
        if (member == null)
            throw new InvalidOperationException("Bạn không phải là thành viên của Workspace này.");

        // Kiểm tra an toàn: Nếu là Manager duy nhất mà nhóm vẫn còn các thành viên khác
        bool isManager = member.Role == "Manager" || workspace.OwnerId == userId;
        if (isManager)
        {
            int otherManagers = workspace.Members.Count(m => m.Role == "Manager" && m.UserId != userId);
            if (otherManagers == 0 && workspace.Members.Count > 1)
            {
                throw new InvalidOperationException("Bạn là Manager duy nhất. Vui lòng chuyển quyền Manager cho thành viên khác trước khi rời nhóm.");
            }
        }

        // Xóa user khỏi mảng members trong MongoDB
        var update = Builders<Workspace>.Update.PullFilter(w => w.Members, m => m.UserId == userId);
        var result = await _workspaces.UpdateOneAsync(w => w.Id == workspaceId, update);
        return result.ModifiedCount > 0;
    }

}
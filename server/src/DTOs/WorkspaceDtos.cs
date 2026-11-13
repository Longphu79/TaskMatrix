namespace TaskMatrix.Api.DTOs;

public record CreateCompanyRequest(string Name);

public record JoinCompanyRequest(string JoinCode);

public record AddMemberRequest(string Email, string Role);

public record ChangeRoleRequest(string Role);

public record WorkspaceResponse(
    string Id,
    string Name,
    string Type,
    string Role,
    string? JoinCode,
    List<WorkspaceMemberDto> Members
);

public record WorkspaceMemberDto(
    string UserId,
    string FullName,
    string Email,
    string Role
);
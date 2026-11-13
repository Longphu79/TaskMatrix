using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WorkspacesController : ControllerBase
{
    private readonly WorkspaceService _workspaceService;

    public WorkspacesController(WorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // GET /api/workspaces
    [HttpGet]
    public async Task<IActionResult> GetMyWorkspaces()
    {
        if (string.IsNullOrEmpty(CurrentUserId)) return Unauthorized();
        var result = await _workspaceService.GetUserWorkspacesAsync(CurrentUserId);
        return Ok(result);
    }

    // POST /api/workspaces
    [HttpPost]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyRequest request)
    {
        if (string.IsNullOrEmpty(CurrentUserId)) return Unauthorized();
        var result = await _workspaceService.CreateCompanyWorkspaceAsync(CurrentUserId, request.Name);
        return Ok(result);
    }

    // POST /api/workspaces/{id}/members
    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(string id, [FromBody] AddMemberRequest request)
    {
        try
        {
            var success = await _workspaceService.AddMemberByEmailAsync(id, CurrentUserId, request.Email, request.Role);
            return Ok(new { message = "Thêm thành viên thành công." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/workspaces/join
    [HttpPost("join")]
    public async Task<IActionResult> JoinCompany([FromBody] JoinCompanyRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(CurrentUserId)) return Unauthorized();
            var result = await _workspaceService.JoinCompanyByCodeAsync(CurrentUserId, request.JoinCode);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT /api/workspaces/{id}/members/{memberId}/role
    [HttpPut("{id}/members/{memberId}/role")]
    public async Task<IActionResult> UpdateMemberRole(string id, string memberId, [FromBody] ChangeRoleRequest request)
    {
        try
        {
            var success = await _workspaceService.UpdateMemberRoleAsync(id, CurrentUserId, memberId, request.Role);
            return Ok(new { message = "Cập nhật vai trò thành công." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE /api/workspaces/{id}/members/{memberId}
    [HttpDelete("{id}/members/{memberId}")]
    public async Task<IActionResult> RemoveMember(string id, string memberId)
    {
        try
        {
            var success = await _workspaceService.RemoveMemberAsync(id, CurrentUserId, memberId);
            return Ok(new { message = "Xóa thành viên thành công." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/leave")]
    public async Task<IActionResult> LeaveWorkspace(string id)
    {
        try
        {
            if (string.IsNullOrEmpty(CurrentUserId)) return Unauthorized();

            var success = await _workspaceService.LeaveWorkspaceAsync(id, CurrentUserId);
            return Ok(new { message = "Đã rời khỏi Workspace thành công." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
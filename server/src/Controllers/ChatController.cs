using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly ChatService _chatService;

    public ChatController(ChatService chatService)
    {
        _chatService = chatService;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("workspaces/{workspaceId}/channels")]
    public async Task<IActionResult> GetChannels(string workspaceId)
    {
        var channels = await _chatService.GetChannelsAsync(workspaceId);
        return Ok(channels);
    }

    [HttpPost("workspaces/{workspaceId}/channels")]
    public async Task<IActionResult> CreateChannel(string workspaceId, [FromBody] CreateChannelDto dto)
    {
        var channel = await _chatService.CreateChannelAsync(workspaceId, GetUserId(), dto);
        return Ok(channel);
    }

    [HttpGet("channels/{channelId}/messages")]
    public async Task<IActionResult> GetChannelMessages(string channelId)
    {
        var messages = await _chatService.GetChannelMessagesAsync(channelId);
        return Ok(messages);
    }

    [HttpGet("workspaces/{workspaceId}/dm/{targetUserId}/messages")]
    public async Task<IActionResult> GetDirectMessages(string workspaceId, string targetUserId)
    {
        var messages = await _chatService.GetDirectMessagesAsync(workspaceId, GetUserId(), targetUserId);
        return Ok(messages);
    }

    [HttpDelete("messages/{messageId}")]
    public async Task<IActionResult> DeleteMessage(string messageId)
    {
        var deleted = await _chatService.DeleteMessageAsync(messageId, GetUserId());
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpDelete("channels/{channelId}/messages")]
    public async Task<IActionResult> ClearChannelMessages(string channelId)
    {
        await _chatService.ClearChannelMessagesAsync(channelId);
        return NoContent();
    }

    [HttpDelete("workspaces/{workspaceId}/dm/{targetUserId}/messages")]
    public async Task<IActionResult> ClearDmMessages(string workspaceId, string targetUserId)
    {
        await _chatService.ClearDirectMessagesAsync(workspaceId, GetUserId(), targetUserId);
        return NoContent();
    }
}
using Microsoft.AspNetCore.SignalR;
using TaskMatrix.Api.Services;
using TaskMatrix.Api.DTOs;

namespace TaskMatrix.Api.Hubs;

public class ChatHub : Hub
{
    private readonly ChatService _chatService;

    public ChatHub(ChatService chatService)
    {
        _chatService = chatService;
    }

    // Tham gia phòng chat của Channel
    public async Task JoinChannel(string channelId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"channel_{channelId}");
    }

    // Rời phòng chat Channel
    public async Task LeaveChannel(string channelId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"channel_{channelId}");
    }

    // Tham gia phòng cá nhân (dùng cho DM)
    public async Task RegisterUser(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    // Gửi tin nhắn real-time
    public async Task SendMessage(string userId, SendMessageDto dto)
    {
        var savedMsg = await _chatService.SaveMessageAsync(userId, dto);

        if (!string.IsNullOrEmpty(dto.ChannelId))
        {
            // Bắn tin nhắn tới toàn bộ người trong Channel
            await Clients.Group($"channel_{dto.ChannelId}").SendAsync("ReceiveMessage", savedMsg);
        }
        else if (!string.IsNullOrEmpty(dto.RecipientId))
        {
            // Bắn tin nhắn cho cả người gửi & người nhận DM
            await Clients.Group($"user_{dto.RecipientId}").SendAsync("ReceiveMessage", savedMsg);
            await Clients.Group($"user_{userId}").SendAsync("ReceiveMessage", savedMsg);
        }
    }
}
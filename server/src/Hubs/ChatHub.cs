using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TaskMatrix.Api.Services;
using TaskMatrix.Api.DTOs;

namespace TaskMatrix.Api.Hubs;

public class ChatHub : Hub
{
    private readonly ChatService _chatService;
    private static readonly ConcurrentDictionary<string, CallSession> _activeCalls = new();

    private class CallSession
    {
        public string RoomId { get; set; } = string.Empty;
        public string WorkspaceId { get; set; } = string.Empty;
        public string CallerId { get; set; } = string.Empty;
        public string? ChannelId { get; set; }
        public string? RecipientId { get; set; }
        public bool IsVideo { get; set; }
        public DateTime? ConnectedAt { get; set; }
        public HashSet<string> Participants { get; } = new();
        public List<string> MemberIds { get; set; } = new();
    }

    public ChatHub(ChatService chatService)
    {
        _chatService = chatService;
    }

    public async Task JoinChannel(string channelId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"channel_{channelId}");
    }

    public async Task LeaveChannel(string channelId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"channel_{channelId}");
    }

    public async Task RegisterUser(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    public async Task SendMessage(string userId, SendMessageDto dto)
    {
        var savedMsg = await _chatService.SaveMessageAsync(userId, dto);

        if (!string.IsNullOrEmpty(dto.ChannelId))
        {
            await Clients.Group($"channel_{dto.ChannelId}").SendAsync("ReceiveMessage", savedMsg);
        }
        else if (!string.IsNullOrEmpty(dto.RecipientId))
        {
            await Clients.Group($"user_{dto.RecipientId}").SendAsync("ReceiveMessage", savedMsg);
            await Clients.Group($"user_{userId}").SendAsync("ReceiveMessage", savedMsg);
        }
    }

    public async Task NotifyMessageDeleted(string messageId, string? channelId, string? recipientId)
    {
        if (!string.IsNullOrEmpty(channelId))
        {
            await Clients.OthersInGroup(channelId).SendAsync("MessageDeleted", messageId);
        }
        else if (!string.IsNullOrEmpty(recipientId))
        {
            await Clients.All.SendAsync("MessageDeleted", messageId);
        }
    }

    public async Task NotifyChatCleared(string? channelId, string? userA, string? userB)
    {
        if (!string.IsNullOrEmpty(channelId))
        {
            await Clients.OthersInGroup(channelId).SendAsync("ChatCleared", new { channelId });
        }
        else if (!string.IsNullOrEmpty(userA) && !string.IsNullOrEmpty(userB))
        {
            await Clients.All.SendAsync("ChatCleared", new { userA, userB });
        }
    }

    // 🟢 Nhận đủ 9 tham số khớp với Chat.jsx:488
    public class NotifyCallRequest
    {
        public string RoomId { get; set; } = string.Empty;
        public string WorkspaceId { get; set; } = string.Empty;
        public string CallerId { get; set; } = string.Empty;
        public string CallerName { get; set; } = "Member";
        public string? ChannelId { get; set; }
        public string? ChannelName { get; set; }
        public string? RecipientId { get; set; }
        public bool VideoEnabled { get; set; }
        public List<string>? MemberIds { get; set; }
    }

    // 🟢 Nhận 1 Object khớp với Chat.jsx
    public async Task NotifyCall(NotifyCallRequest req)
    {
        var session = _activeCalls.GetOrAdd(req.RoomId, _ => new CallSession { RoomId = req.RoomId });
        lock (session)
        {
            session.WorkspaceId = req.WorkspaceId;
            session.CallerId = req.CallerId;
            session.ChannelId = req.ChannelId;
            session.RecipientId = req.RecipientId;
            session.IsVideo = req.VideoEnabled;
            session.MemberIds = req.MemberIds ?? new List<string>();

            if (session.Participants.Count >= 2 && !session.ConnectedAt.HasValue)
            {
                session.ConnectedAt = DateTime.UtcNow;
            }
        }

        var payload = new
        {
            roomId = req.RoomId,
            callerId = req.CallerId,
            callerName = req.CallerName,
            channelId = req.ChannelId,
            channelName = req.ChannelName,
            recipientId = req.RecipientId,
            videoEnabled = req.VideoEnabled
        };

        if (!string.IsNullOrEmpty(req.ChannelId))
        {
            await Clients.OthersInGroup($"channel_{req.ChannelId}").SendAsync("IncomingCall", payload);

            if (req.MemberIds != null)
            {
                foreach (var memberId in req.MemberIds.Distinct())
                {
                    if (!string.IsNullOrEmpty(memberId) && memberId != req.CallerId)
                    {
                        await Clients.Group($"user_{memberId}").SendAsync("IncomingCall", payload);
                    }
                }
            }
        }
        else if (!string.IsNullOrEmpty(req.RecipientId))
        {
            await Clients.Group($"user_{req.RecipientId}").SendAsync("IncomingCall", payload);
        }
    }
    // 🟢 Tham gia phòng gọi & bắt đầu tính giờ khi đủ 2 người
    public async Task JoinCall(string roomId, string userId, string userName, bool videoEnabled, string? avatarUrl = null)
    {
        var callGroup = $"call_{roomId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, callGroup);

        var session = _activeCalls.GetOrAdd(roomId, _ => new CallSession { RoomId = roomId });
        lock (session)
        {
            session.Participants.Add(Context.ConnectionId);
            if (session.Participants.Count >= 2 && !session.ConnectedAt.HasValue)
            {
                session.ConnectedAt = DateTime.UtcNow;
            }
        }

        await Clients.OthersInGroup(callGroup).SendAsync("UserJoinedCall", new
        {
            connectionId = Context.ConnectionId,
            userId,
            userName,
            videoEnabled,
            avatarUrl
        });
    }

    public async Task SendCallSignal(string targetConnectionId, object signalData)
    {
        await Clients.Client(targetConnectionId).SendAsync("ReceiveCallSignal", new
        {
            senderConnectionId = Context.ConnectionId,
            signalData
        });
    }

    public async Task ToggleCallMedia(string roomId, bool micEnabled, bool videoEnabled)
    {
        await Clients.OthersInGroup($"call_{roomId}").SendAsync("PeerMediaToggled", new
        {
            connectionId = Context.ConnectionId,
            micEnabled,
            videoEnabled
        });
    }

    // 🟢 Bên nhận từ chối -> Lưu "Missed call"
    public async Task DeclineCall(string roomId)
    {
        if (_activeCalls.TryRemove(roomId, out var session))
        {
            if (!string.IsNullOrEmpty(session.CallerId))
            {
                await Clients.Group($"user_{session.CallerId}").SendAsync("CallDeclined", roomId);
            }
            await EndAndLogSessionAsync(session);
        }
    }

    // 🟢 Rời cuộc gọi -> Chốt thời lượng gọi hoặc cuộc gọi nhỡ
    public async Task LeaveCall(string roomId)
    {
        var callGroup = $"call_{roomId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, callGroup);
        await Clients.OthersInGroup(callGroup).SendAsync("UserLeftCall", Context.ConnectionId);

        if (_activeCalls.TryGetValue(roomId, out var session))
        {
            bool shouldEnd = false;
            bool wasConnected = false;

            lock (session)
            {
                // Nếu connectionId này chưa từng nằm trong Participants thì bỏ qua
                if (!session.Participants.Remove(Context.ConnectionId))
                {
                    return;
                }

                wasConnected = session.ConnectedAt.HasValue;

                if (string.IsNullOrEmpty(session.ChannelId) || session.Participants.Count == 0)
                {
                    shouldEnd = true;
                }
            }

            if (shouldEnd && _activeCalls.TryRemove(roomId, out var removedSession))
            {
                if (!string.IsNullOrEmpty(removedSession.ChannelId))
                {
                    await Clients.OthersInGroup($"channel_{removedSession.ChannelId}").SendAsync("CallCanceled", roomId);
                    foreach (var memberId in removedSession.MemberIds.Distinct())
                    {
                        if (!string.IsNullOrEmpty(memberId) && memberId != removedSession.CallerId)
                        {
                            await Clients.Group($"user_{memberId}").SendAsync("CallCanceled", roomId);
                        }
                    }
                }
                else if (!string.IsNullOrEmpty(removedSession.RecipientId))
                {
                    var eventName = wasConnected ? "CallEnded" : "CallCanceled";
                    await Clients.Group($"user_{removedSession.RecipientId}").SendAsync(eventName, roomId);
                    await Clients.Group($"user_{removedSession.CallerId}").SendAsync(eventName, roomId);
                }

                await EndAndLogSessionAsync(removedSession);
            }
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        foreach (var kvp in _activeCalls)
        {
            bool containsUser;
            lock (kvp.Value)
            {
                containsUser = kvp.Value.Participants.Contains(Context.ConnectionId);
            }
            if (containsUser)
            {
                await LeaveCall(kvp.Key);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task EndAndLogSessionAsync(CallSession session)
    {
        try
        {
            string status;
            string durationText;

            lock (session)
            {
                if (session.ConnectedAt.HasValue)
                {
                    var span = DateTime.UtcNow - session.ConnectedAt.Value;
                    if (span.TotalSeconds < 1) span = TimeSpan.FromSeconds(1);
                    status = "ended";
                    durationText = span.TotalHours >= 1
                        ? $"{(int)span.TotalHours:D2}:{span.Minutes:D2}:{span.Seconds:D2}"
                        : $"{span.Minutes:D2}:{span.Seconds:D2}";
                }
                else
                {
                    status = "missed";
                    durationText = "00:00";
                }
            }

            if (string.IsNullOrEmpty(session.WorkspaceId) || string.IsNullOrEmpty(session.CallerId))
                return;

            var dto = new SendMessageDto(
                session.WorkspaceId,
                session.ChannelId,
                session.RecipientId,
                $"[[CALL_LOG]]{status}|{session.IsVideo.ToString().ToLower()}|{durationText}",
                null
            );

            var savedMsg = await _chatService.SaveMessageAsync(session.CallerId, dto);

            if (!string.IsNullOrEmpty(session.ChannelId))
            {
                await Clients.Group($"channel_{session.ChannelId}").SendAsync("ReceiveMessage", savedMsg);
            }
            else if (!string.IsNullOrEmpty(session.RecipientId))
            {
                await Clients.Group($"user_{session.RecipientId}").SendAsync("ReceiveMessage", savedMsg);
                await Clients.Group($"user_{session.CallerId}").SendAsync("ReceiveMessage", savedMsg);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EndAndLogSessionAsync Error] {ex.Message}");
        }
    }
}

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? Context.User?.FindFirst("nameid")?.Value
                     ?? Context.User?.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? Context.User?.FindFirst("nameid")?.Value
                     ?? Context.User?.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await base.OnDisconnectedAsync(exception);
    }
}
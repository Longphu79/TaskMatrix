using MongoDB.Driver;
using TaskMatrix.Api.Models;
using TaskMatrix.Api.DTOs;

namespace TaskMatrix.Api.Services;

public class ChatService
{
    private readonly IMongoCollection<Channel> _channels;
    private readonly IMongoCollection<TeamChatMessage> _messages;
    private readonly IMongoCollection<User> _users;

    public ChatService(IMongoDatabase database)
    {
        _channels = database.GetCollection<Channel>("channels");
        _messages = database.GetCollection<TeamChatMessage>("team_messages");
        _users = database.GetCollection<User>("users");
    }

    public async Task<List<Channel>> GetChannelsAsync(string workspaceId)
    {
        var list = await _channels.Find(c => c.WorkspaceId == workspaceId).ToListAsync();
        if (list.Count == 0)
        {
            var defaultChannel = new Channel
            {
                WorkspaceId = workspaceId,
                Name = "general",
                Topic = "Company-wide announcements & watercooler",
                CreatedBy = "system"
            };
            await _channels.InsertOneAsync(defaultChannel);
            list.Add(defaultChannel);
        }
        return list;
    }

    public async Task<Channel> CreateChannelAsync(string workspaceId, string userId, CreateChannelDto dto)
    {
        var channel = new Channel
        {
            WorkspaceId = workspaceId,
            Name = dto.Name.ToLower().Replace(" ", "-"),
            Topic = dto.Topic,
            CreatedBy = userId
        };
        await _channels.InsertOneAsync(channel);
        return channel;
    }

    public async Task<List<ChatMessageResponseDto>> GetChannelMessagesAsync(string channelId, int limit = 50)
    {
        var msgs = await _messages
            .Find(m => m.ChannelId == channelId)
            .SortBy(m => m.CreatedAt)
            .Limit(limit)
            .ToListAsync();

        return msgs.Select(MapToDto).ToList();
    }

    public async Task<List<ChatMessageResponseDto>> GetDirectMessagesAsync(string workspaceId, string user1Id, string user2Id, int limit = 50)
    {
        var filter = Builders<TeamChatMessage>.Filter.And(
            Builders<TeamChatMessage>.Filter.Eq(m => m.WorkspaceId, workspaceId),
            Builders<TeamChatMessage>.Filter.Or(
                Builders<TeamChatMessage>.Filter.And(
                    Builders<TeamChatMessage>.Filter.Eq(m => m.SenderId, user1Id),
                    Builders<TeamChatMessage>.Filter.Eq(m => m.RecipientId, user2Id)
                ),
                Builders<TeamChatMessage>.Filter.And(
                    Builders<TeamChatMessage>.Filter.Eq(m => m.SenderId, user2Id),
                    Builders<TeamChatMessage>.Filter.Eq(m => m.RecipientId, user1Id)
                )
            )
        );

        var msgs = await _messages
            .Find(filter)
            .SortBy(m => m.CreatedAt)
            .Limit(limit)
            .ToListAsync();

        return msgs.Select(MapToDto).ToList();
    }

    public async Task<ChatMessageResponseDto> SaveMessageAsync(string senderId, SendMessageDto dto)
    {
        var sender = await _users.Find(u => u.Id == senderId).FirstOrDefaultAsync();

        var msg = new TeamChatMessage
        {
            WorkspaceId = dto.WorkspaceId,
            ChannelId = dto.ChannelId,
            RecipientId = dto.RecipientId,
            SenderId = senderId,
            SenderName = sender?.FullName ?? "Member",
            SenderRole = sender?.Role ?? "Member",
            SenderAvatar = sender?.Avatar,
            Text = dto.Text,
            Attachment = dto.Attachment,
            CreatedAt = DateTime.UtcNow
        };

        await _messages.InsertOneAsync(msg);
        return MapToDto(msg);
    }

    private static ChatMessageResponseDto MapToDto(TeamChatMessage m) => new(
        Id: m.Id!,
        SenderId: m.SenderId,
        SenderName: m.SenderName,
        SenderRole: m.SenderRole,
        SenderAvatar: m.SenderAvatar,
        ChannelId: m.ChannelId,
        RecipientId: m.RecipientId,
        Text: m.Text,
        Attachment: m.Attachment,
        Time: m.CreatedAt.ToLocalTime().ToString("hh:mm tt"),
        CreatedAt: m.CreatedAt
    );
}
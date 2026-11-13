namespace TaskMatrix.Api.DTOs;

public record CreateChannelDto(string Name, string Topic);

public record SendMessageDto(
    string WorkspaceId,
    string? ChannelId,
    string? RecipientId,
    string Text,
    TaskMatrix.Api.Models.MessageAttachment? Attachment
);

public record ChatMessageResponseDto(
    string Id,
    string SenderId,
    string SenderName,
    string SenderRole,
    string? SenderAvatar,
    string? ChannelId,
    string? RecipientId,
    string Text,
    TaskMatrix.Api.Models.MessageAttachment? Attachment,
    string Time,
    DateTime CreatedAt
);
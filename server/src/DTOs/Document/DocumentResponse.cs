namespace TaskMatrix.Api.DTO.Document;

/// <summary>Document metadata returned to its owner.</summary>
public sealed record DocumentResponse(
    string Id,
    string Title,
    string FileName,
    string Format,
    string Category,
    int Progress,
    DateTimeOffset Start,
    DateTimeOffset Deadline,
    long Size,
    string ContentType,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

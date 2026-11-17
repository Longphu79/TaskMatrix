using System.ComponentModel.DataAnnotations;

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

/// <summary>Metadata and file content for a new document.</summary>
public sealed record CreateDocumentRequest
{
    [Required, StringLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required, StringLength(100)]
    public string Category { get; init; } = string.Empty;

    [Range(0, 100)]
    public int Progress { get; init; }

    [Required]
    public DateTimeOffset? Start { get; init; }

    [Required]
    public DateTimeOffset? Deadline { get; init; }

    [Required]
    public IFormFile? File { get; init; }
}

/// <summary>Metadata used to update an existing document.</summary>
public sealed record UpdateDocumentRequest
{
    [Required, StringLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required, StringLength(100)]
    public string Category { get; init; } = string.Empty;

    [Range(0, 100)]
    public int Progress { get; init; }

    [Required]
    public DateTimeOffset? Start { get; init; }

    [Required]
    public DateTimeOffset? Deadline { get; init; }
}

/// <summary>Progress value for a document.</summary>
public sealed record UpdateDocumentProgressRequest
{
    [Range(0, 100)]
    public int Progress { get; init; }
}
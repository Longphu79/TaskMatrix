using System.ComponentModel.DataAnnotations;

namespace TaskMatrix.Api.DTO.Document;

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

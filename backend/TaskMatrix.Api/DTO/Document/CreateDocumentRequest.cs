using System.ComponentModel.DataAnnotations;

namespace TaskMatrix.Api.DTO.Document;

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

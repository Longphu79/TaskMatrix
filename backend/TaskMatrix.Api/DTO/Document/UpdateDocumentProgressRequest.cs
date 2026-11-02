using System.ComponentModel.DataAnnotations;

namespace TaskMatrix.Api.DTO.Document;

/// <summary>Progress value for a document.</summary>
public sealed record UpdateDocumentProgressRequest
{
    [Range(0, 100)]
    public int Progress { get; init; }
}

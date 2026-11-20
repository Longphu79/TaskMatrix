using System.ComponentModel.DataAnnotations;

namespace TaskMatrix.Api.DTOs;

public sealed record ProfileResponse(
    string FullName,
    string Email,
    string? Occupation,
    IReadOnlyList<string> Goals,
    string? FreeTime,
    string? Avatar
);

public sealed class UpdateProfileRequest
{
    [Required]
    [StringLength(120)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Occupation { get; set; }

    [Required]
    public List<string> Goals { get; set; } = new();

    [StringLength(1000)]
    public string? FreeTime { get; set; }

    [StringLength(2_000_000)]
    public string? Avatar { get; set; }
}

namespace TaskMatrix.Api.DTOs.Profile;

public class ProfileResponse
{
    public string UserId { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Occupation { get; set; }

    public List<string> Goals { get; set; } = [];

    public string? FreeTime { get; set; }
}
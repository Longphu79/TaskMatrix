namespace TaskMatrix.Api.DTOs.Profile;

public class UpdateProfileRequest
{
    public string? FullName { get; set; }

    public string? Occupation { get; set; }

    public List<string> Goals { get; set; } = [];

    public string? FreeTime { get; set; }
}
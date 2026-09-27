namespace TaskMatrix.Api.DTO.Task;

public class CreateTaskRequest
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Priority { get; set; } = "Medium";

    public DateTime? DueDate { get; set; }

    public int? EstimatedMinutes { get; set; }
}
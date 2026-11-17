namespace TaskMatrix.Api.DTOs;

public class AiParseTaskRequest
{
    public string? Prompt { get; set; } = string.Empty;
    public string UserTimeZone { get; set; } = "SE Asia Standard Time";
    public IFormFile? Image { get; set; }
}

public class AiResponseDto
{
    // "CREATE_TASK" hoặc "CHAT"
    public string Intent { get; set; } = "CHAT";
    public string ReplyMessage { get; set; } = string.Empty;
    public string? TargetTaskId { get; set; }
    public string? TargetTaskTitle { get; set; }
    public ParsedTaskDto? Task { get; set; }
}

public class ParsedTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public List<ParsedSubTaskDto>? SubTasks { get; set; }
}

public class AiProofResultDto
{
    public bool Ok { get; set; }
    public string AiStatus { get; set; } = "feedback";
    public string? Reasoning { get; set; }
    public string? Feedback { get; set; }
    public bool Partial { get; set; }
    public int Progress { get; set; }
    public string? ProofImageUrl { get; set; }
}

public class ParsedSubTaskDto
{
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; } = false;
}


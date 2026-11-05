namespace TaskMatrix.Api.DTOs;

// 🟢 Thêm DTO này để hứng request gửi từ Frontend lên
public class AiParseTaskRequest
{
    public string Prompt { get; set; } = string.Empty;
    public string UserTimeZone { get; set; } = "SE Asia Standard Time";
}

public class AiResponseDto
{
    // "CREATE_TASK" hoặc "CHAT"
    public string Intent { get; set; } = "CHAT";
    public string ReplyMessage { get; set; } = string.Empty;
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
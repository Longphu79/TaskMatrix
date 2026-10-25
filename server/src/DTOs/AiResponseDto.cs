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

    // Câu trả lời bằng văn bản của AI gửi lại cho user
    public string ReplyMessage { get; set; } = string.Empty;

    // Thông tin Task (chỉ có dữ liệu khi Intent == "CREATE_TASK")
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
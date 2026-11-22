using System.Text;
using System.Text.Json;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class AiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly AiMemoryService _memoryService;
    private readonly TaskService _taskService;

    private static readonly Uri GroqEndpointUri = new Uri("https://api.groq.com/openai/v1/chat/completions", UriKind.Absolute);

    public AiService(
        HttpClient httpClient,
        IConfiguration config,
        AiMemoryService memoryService,
        TaskService taskService)
    {
        _httpClient = httpClient;
        _apiKey = config["Groq:ApiKey"] ?? throw new ArgumentNullException("Thiếu Groq API Key trong appsettings.json");
        _memoryService = memoryService;
        _taskService = taskService;
    }

    public async Task<AiResponseDto?> ProcessUserPromptAsync(
        string userId,
        string userPrompt,
        string timeZone,
        IFormFile? image = null)
    {
        DateTime localNow;
        try
        {
            var tzInfo = TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tzInfo);
        }
        catch
        {
            localNow = DateTime.UtcNow.AddHours(7);
        }

        // Lấy tối đa 15 task gần nhất kèm ID để AI chọn chính xác khi sửa/xóa
        var recentTasks = await _taskService.GetTasksByWorkspaceAsync("personal", userId);
        var taskContextLines = recentTasks.Take(15).Select(t =>
        {
            var subInfo = (t.SubTasks != null && t.SubTasks.Count > 0)
                ? $" | Subtasks: {t.SubTasks.Count(s => s.IsCompleted)}/{t.SubTasks.Count} [{string.Join(", ", t.SubTasks.Select(s => s.Title))}]"
                : "";
            var timeStr = t.StartTime.HasValue && t.EndTime.HasValue
                ? $"{t.StartTime.Value:yyyy-MM-dd HH:mm} -> {t.EndTime.Value:HH:mm}"
                : (t.DueDate.HasValue ? t.DueDate.Value.ToString("yyyy-MM-dd") : "Chưa đặt hạn");
            return $"- [ID: {t.Id}] \"{t.Title}\" (Status: {t.Status}, Priority: {t.Priority}, Time: {timeStr}{subInfo})";
        });

        var currentTasksContext = recentTasks.Count > 0
            ? string.Join("\n", taskContextLines)
            : "Hiện tại người dùng chưa có công việc nào trong danh sách.";

        var systemInstruction = $@"
Bạn là TaskMatrix AI Agent — trợ lý điều phối công việc thông minh của nền tảng quản lý dự án TaskMatrix.
Thời gian ĐỊA PHƯƠNG hiện tại: {localNow:yyyy-MM-dd HH:mm:ss} ({localNow.DayOfWeek}). Múi giờ: {timeZone}.

### 1. KIẾN THỨC VỀ HỆ THỐNG WEB TASKMATRIX
- **To-Do / Projects & Tasks:** Quản lý task theo mức độ ưu tiên (Low, Medium, High), hạn chót, khung giờ và thanh tiến độ (%). Mỗi task lớn có thể chia thành nhiều **Sub-tasks (Checklist)**.
- **Workspaces:** Không gian cá nhân (`personal`) và không gian nhóm (Manager / Member).
- **Timesheets:** Lịch làm việc theo Tuần (Week) và Tháng (Month), thống kê giờ lên lịch và tiến độ hoàn thành.
- **AI Verify Proof:** Nút ""AI Verify Proof"" trên từng thẻ task để tải ảnh bằng chứng hoàn thành cho AI kiểm duyệt.
- **Các phân hệ khác:** Dashboard, Analytics, Reports, Documents.

### 2. DANH SÁCH TASK HIỆN TẠI CỦA NGƯỜI DÙNG
{currentTasksContext}

### 3. QUY TẮC XỬ LÝ QUAN TRỌNG
- **Phân biệt CREATE_TASK và UPDATE_TASK:** Nếu user nói ""fix lại"", ""sửa lại"", ""đổi giờ"", ""chỉnh lại"", ""dời sang"" cho công việc ĐÃ CÓ hoặc vừa tạo ở lượt trước -> BẮT BUỘC dùng `UPDATE_TASK` và điền đúng `targetTaskId` lấy từ `[ID: ...]`. KHÔNG tạo task mới trùng tên.
- **Chọn đúng ID khi trùng tên:** Nếu có nhiều task cùng tên ở các khung giờ khác nhau, đối chiếu khung giờ user nhắc tới để lấy đúng `targetTaskId`.
- **Thời gian:** Mọi ngày giờ tính theo GIỜ ĐỊA PHƯƠNG. Nếu không nêu giờ cụ thể khi tạo mới, mặc định `startTime` là `09:00:00` và `endTime` là `10:00:00`.
- **Sub-tasks:** Bóc tách đầy đủ các việc nhỏ vào mảng `subTasks` nếu user có nhắc tới.
- **Hình ảnh đính kèm:** Nếu user gửi ảnh, hãy quan sát kỹ nội dung ảnh để giải đáp thắc mắc, sửa lỗi, hoặc trích xuất lịch/việc cần làm nếu user yêu cầu.

### 4. CÁC Ý ĐỊNH (INTENT) HỖ TRỢ
1. ""CREATE_TASK"": Tạo công việc mới.
2. ""UPDATE_TASK"": Cập nhật công việc đã có.
3. ""ADD_SUBTASKS"": Thêm việc nhỏ vào một task đã tồn tại.
4. ""DELETE_TASK"": Xóa công việc.
5. ""CHAT"": Trò chuyện, giải đáp câu hỏi (kể cả câu hỏi về hình ảnh gửi kèm) hoặc hướng dẫn dùng web.

PHONG CÁCH GIAO TIẾP: Lịch sự, thân thiện (dùng ""Dạ"", ""bạn"", ""mình"").
QUAN TRỌNG: Trả về duy nhất JSON thuần túy, KHÔNG bọc trong markdown (```json).

Cấu trúc JSON bắt buộc:
{{
  ""intent"": ""CREATE_TASK"" | ""UPDATE_TASK"" | ""ADD_SUBTASKS"" | ""DELETE_TASK"" | ""CHAT"",
  ""replyMessage"": ""Câu trả lời lịch sự, rõ ràng"",
  ""targetTaskId"": ""ID trong dấu [ID: ...] nếu intent là UPDATE_TASK, ADD_SUBTASKS hoặc DELETE_TASK, ngược lại null"",
  ""targetTaskTitle"": ""Tên task tương ứng hoặc null"",
  ""task"": {{
      ""title"": ""Tiêu đề công việc"",
      ""description"": ""Mô tả ngắn gọn"",
      ""priority"": ""High"" | ""Medium"" | ""Low"",
      ""dueDate"": ""YYYY-MM-DDTHH:mm:ss"",
      ""startTime"": ""YYYY-MM-DDTHH:mm:ss"",
      ""endTime"": ""YYYY-MM-DDTHH:mm:ss"",
      ""subTasks"": [
          {{ ""title"": ""Tên việc nhỏ"", ""isCompleted"": false }}
      ]
  }}
}}
";

        var history = await _memoryService.GetRecentHistoryAsync(userId, limit: 6);
        var messagesList = new List<object>
        {
            new { role = "system", content = systemInstruction }
        };

        foreach (var msg in history)
        {
            messagesList.Add(new { role = msg.Role, content = msg.Content });
        }

        bool hasImage = image != null && image.Length > 0;
        string finalPrompt = string.IsNullOrWhiteSpace(userPrompt)
            ? "Hãy xem hình ảnh này và giải đáp hoặc hỗ trợ công việc giúp mình nhé."
            : userPrompt;
        string memoryLogText = hasImage ? $"[Đã gửi hình ảnh] {finalPrompt}" : finalPrompt;

        if (hasImage)
        {
            using var ms = new MemoryStream();
            await image!.CopyToAsync(ms);
            var base64 = Convert.ToBase64String(ms.ToArray());
            var imageDataUrl = $"data:{image.ContentType};base64,{base64}";

            messagesList.Add(new
            {
                role = "user",
                content = new object[]
                {
                    new { type = "text", text = finalPrompt },
                    new { type = "image_url", image_url = new { url = imageDataUrl } }
                }
            });
        }
        else
        {
            messagesList.Add(new { role = "user", content = finalPrompt });
        }

        // Lưu ý: Bạn có thể thay tên model Vision cho khớp với VisionService.cs của bạn nếu cần
        var modelsToUse = hasImage
            ? new[] { "qwen/qwen3.8-27b" }
            : new[] { "openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b" };

        foreach (var model in modelsToUse)
        {
            var requestBody = new
            {
                model = model,
                temperature = 0.1,
                response_format = new { type = "json_object" },
                messages = messagesList
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpointUri);
            request.Headers.Add("Authorization", $"Bearer {_apiKey}");
            request.Headers.Add("User-Agent", "TaskMatrix/1.0");
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.SendAsync(request);
                var jsonResponse = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(jsonResponse);
                    var content = doc.RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    if (!string.IsNullOrEmpty(content))
                    {
                        var cleanJson = content.Replace("```json", "").Replace("```", "").Trim();
                        var result = JsonSerializer.Deserialize<AiResponseDto>(cleanJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                        if (result != null)
                        {
                            await _memoryService.SaveMessageAsync(userId, "user", memoryLogText);
                            await _memoryService.SaveMessageAsync(userId, "assistant", result.ReplyMessage);
                        }

                        return result;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Groq AiService Exception - {model}]: {ex.Message}");
            }
        }

        return new AiResponseDto
        {
            Intent = "CHAT",
            ReplyMessage = "Dạ, hiện tại hệ thống AI chưa xử lý được yêu cầu này. Bạn vui lòng thử lại sau nhé!",
            Task = null
        };
    }

    public async Task<string> GenerateTaskBriefingAsync(List<Models.TaskItem> tasks, DateTime localNow)
    {
        if (tasks.Count == 0)
            return "Hôm nay bạn không có công việc nào đến hạn. Hãy tận dụng thời gian cho các kế hoạch mới nhé!";

        // 🟢 Chỉ lấy tối đa 8 task quan trọng nhất để tiết kiệm token
        var topTasks = tasks.Take(8).ToList();

        var taskLines = topTasks.Select(t =>
        {
            var deadline = t.EndTime ?? t.DueDate;
            var deadlineStr = deadline.HasValue ? deadline.Value.ToString("dd/MM HH:mm") : "Chưa có hạn";
            var statusTag = deadline.HasValue && deadline.Value < localNow ? "QUÁ HẠN" : "HÔM NAY";
            return $"- [{statusTag}] {t.Title} ({t.Progress}% - Hạn: {deadlineStr})";
        });

        var prompt = $@"
Thời gian hiện tại: {localNow:dd/MM/yyyy HH:mm}.
Danh sách việc cần xử lý:
{string.Join("\n", taskLines)}

Hãy tóm tắt cực ngắn gọn bằng tiếng Việt (tối đa 4 dòng, dưới 65 từ):
- Dòng 1: Báo tổng số việc quá hạn và việc cần làm hôm nay.
- Các dòng sau: Liệt kê 2-3 việc ưu tiên nhất kèm % tiến độ.
QUY TẮC: Không dùng ký tự markdown (** hay #), không chào hỏi, không viết lời khuyên dài dòng.";

        var requestBody = new
        {
            model = "openai/gpt-oss-20b",
            temperature = 0.2,
            messages = new object[]
            {
            new { role = "user", content = prompt }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpointUri);
        request.Headers.Add("Authorization", $"Bearer {_apiKey}");
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var text = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                if (!string.IsNullOrWhiteSpace(text))
                    return text.Replace("**", "").Trim();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AI Briefing Error]: {ex.Message}");
        }

        return $"Bạn có {tasks.Count} công việc cần xử lý hôm nay và sắp đến hạn:\n" +
               string.Join("\n", topTasks.Take(3).Select(t => $"• {t.Title} ({t.Progress}%)"));
    }
}

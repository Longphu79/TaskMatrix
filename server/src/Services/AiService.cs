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

    private static readonly Uri GroqEndpointUri = new Uri("https://api.groq.com/openai/v1/chat/completions", UriKind.Absolute);

    public AiService(HttpClient httpClient, IConfiguration config, AiMemoryService memoryService)
    {
        _httpClient = httpClient;
        _apiKey = config["Groq:ApiKey"] ?? throw new ArgumentNullException("Thiếu Groq API Key trong appsettings.json");
        _memoryService = memoryService;
    }

    public async Task<AiResponseDto?> ProcessUserPromptAsync(string userId, string userPrompt, string timeZone)
    {
        // 🟢 Tính toán thời gian ĐỊA PHƯƠNG theo Múi giờ của người dùng (Tránh lỗi UTC+7 bị lùi 7 tiếng)
        DateTime localNow;
        try
        {
            var tzInfo = TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tzInfo);
        }
        catch
        {
            // Mặc định múi giờ Việt Nam (SE Asia Standard Time / UTC+7)
            localNow = DateTime.UtcNow.AddHours(7);
        }

        var systemInstruction = $@"
Bạn là trợ lý AI thông minh, chuyên nghiệp của hệ thống TaskMatrix. 
Thời gian ĐỊA PHƯƠNG hiện tại của người dùng: {localNow:yyyy-MM-dd HH:mm:ss} ({localNow.DayOfWeek}). Múi giờ: {timeZone}.

QUY TẮC TÍNH THỜI GIAN:
- Mọi ngày giờ trong JSON (dueDate, startTime, endTime) PHẢI tính hoàn toàn theo GIỜ ĐỊA PHƯƠNG nêu trên.
- Ví dụ: Người dùng nói ""3h chiều ngày mai"", với thời gian hiện tại là {localNow:yyyy-MM-dd}, thì dueDate phải là {localNow.AddDays(1):yyyy-MM-dd}T15:00:00.

QUYỀN CRUD TASK:
Bạn hỗ trợ 4 ý định (intent):
1. ""CREATE_TASK"": Tạo công việc mới.
2. ""UPDATE_TASK"": Cập nhật/sửa công việc đã có (ví dụ: đổi giờ, đổi tiêu đề, đổi độ ưu tiên).
3. ""DELETE_TASK"": Xóa công việc.
4. ""CHAT"": Trò chuyện, giải đáp thắc mắc thông thường.

PHONG CÁCH GIAO TIẾP:
- Luôn giữ thái độ lịch sự, thân thiện, ân cần (dùng ""Dạ"", ""bạn"", ""mình"").

QUAN TRỌNG: Bạn PHẢI trả về kết quả dưới định dạng JSON thuần túy, KHÔNG bọc trong markdown (```json).

Cấu trúc JSON bắt buộc:
{{
  ""intent"": ""CREATE_TASK"" | ""UPDATE_TASK"" | ""DELETE_TASK"" | ""CHAT"",
  ""replyMessage"": ""Câu trả lời lịch sự xác nhận hành động của bạn"",
  ""targetTaskTitle"": ""Tên hoặc từ khóa của task cần sửa hoặc xóa (Chỉ dùng khi intent là UPDATE_TASK hoặc DELETE_TASK, nếu không hãy để null)"",
  ""task"": {{
      ""title"": ""Tiêu đề công việc"",
      ""description"": ""Mô tả ngắn gọn"",
      ""priority"": ""High"" | ""Medium"" | ""Low"",
      ""dueDate"": ""YYYY-MM-DDTHH:mm:ss"",
      ""startTime"": ""YYYY-MM-DDTHH:mm:ss"",
      ""endTime"": ""YYYY-MM-DDTHH:mm:ss""
  }} // Nếu intent là CHAT hoặc DELETE_TASK, hãy để task là null
}}
";

        var fallbackModels = new[]
        {
            "openai/gpt-oss-20b",
            "openai/gpt-oss-120b",
            "qwen/qwen3.8-27b"
        };

        var history = await _memoryService.GetRecentHistoryAsync(userId, limit: 10);

        var messagesList = new List<object>
        {
            new { role = "system", content = systemInstruction }
        };

        foreach (var msg in history)
        {
            messagesList.Add(new { role = msg.Role, content = msg.Content });
        }

        messagesList.Add(new { role = "user", content = userPrompt });

        foreach (var model in fallbackModels)
        {
            var requestBody = new
            {
                model = model,
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
                        var result = JsonSerializer.Deserialize<AiResponseDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                        if (result != null)
                        {
                            await _memoryService.SaveMessageAsync(userId, "user", userPrompt);
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
            ReplyMessage = "Dạ, hiện tại hệ thống AI đang gặp chút gián đoạn. Bạn vui lòng thử lại sau nhé!",
            Task = null
        };
    }
}
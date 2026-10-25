using System.Text;
using System.Text.Json;
using TaskMatrix.Api.DTOs;

namespace TaskMatrix.Api.Services;

public class AiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public AiService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["Groq:ApiKey"] ?? throw new ArgumentNullException("Thiếu Groq API Key trong appsettings.json");
    }

    public async Task<AiResponseDto?> ProcessUserPromptAsync(string userPrompt, string timeZone)
    {
        var now = DateTime.UtcNow;

        var systemInstruction = $@"
Bạn là trợ lý AI của TaskMatrix. Thời gian UTC: {now:yyyy-MM-dd HH:mm:ss}. Múi giờ: {timeZone}.
QUAN TRỌNG: Bạn PHẢI trả về kết quả dưới định dạng JSON thuần túy, tuyệt đối KHÔNG bọc trong markdown.

Cấu trúc JSON:
{{
  ""intent"": ""CREATE_TASK"" hoặc ""CHAT"",
  ""replyMessage"": ""Câu trả lời của bạn"",
  ""task"": {{
      ""title"": ""Tiêu đề"",
      ""description"": ""Mô tả ngắn"",
      ""priority"": ""High"" | ""Medium"" | ""Low"",
      ""dueDate"": ""YYYY-MM-DDTHH:mm:ss""
  }} // Nếu intent là CHAT, hãy để task là null
}}
";

        // Sử dụng đúng các model có trong tài khoản Groq của bạn
        var fallbackModels = new[]
        {
            "openai/gpt-oss-20b",
            "openai/gpt-oss-120b",
            "qwen/qwen3.8-27b"
        };

        foreach (var model in fallbackModels)
        {
            var requestBody = new
            {
                model = model,
                response_format = new { type = "json_object" },
                messages = new object[]
                {
                    new { role = "system", content = systemInstruction },
                    new { role = "user", content = userPrompt }
                }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
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

                    if (string.IsNullOrEmpty(content)) return null;

                    return JsonSerializer.Deserialize<AiResponseDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                }

                Console.WriteLine($"[Groq AiService] Model '{model}' không khả dụng ({response.StatusCode}): {jsonResponse}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Groq AiService Exception - {model}]: {ex.Message}");
            }
        }

        return new AiResponseDto
        {
            Intent = "CHAT",
            ReplyMessage = "Không thể kết nối đến máy chủ Groq. Vui lòng thử lại sau!",
            Task = null
        };
    }
}
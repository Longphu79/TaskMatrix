using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace TaskMatrix.Api.Services;

public class TaskVerificationResult
{
    public bool IsCompleted { get; set; }
    public string Reasoning { get; set; } = string.Empty;
}

public class VisionService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public VisionService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["Groq:ApiKey"] ?? throw new ArgumentNullException("Thiếu Groq API Key trong appsettings.json");
    }

    public async Task<TaskVerificationResult?> VerifyTaskProofAsync(string taskTitle, string taskDescription, IFormFile imageFile)
    {
        if (imageFile == null || imageFile.Length == 0) return null;

        using var ms = new MemoryStream();
        await imageFile.CopyToAsync(ms);
        var base64Image = Convert.ToBase64String(ms.ToArray());

        var prompt = $@"
Công việc cần thực hiện:
- Tiêu đề: {taskTitle}
- Mô tả: {taskDescription}

Hãy phân tích bức ảnh và xác nhận xem đây có phải là bằng chứng hợp lệ cho thấy công việc đã hoàn thành hay không.
Trả về định dạng JSON thuần túy có cấu trúc:
{{
  ""isCompleted"": true hoặc false,
  ""reasoning"": ""Giải thích ngắn gọn bằng tiếng Việt lý do chấp nhận hoặc từ chối.""
}}
";

        var requestBody = new
        {
            model = "qwen/qwen3.8-27b",
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "text", text = prompt },
                        new
                        {
                            type = "image_url",
                            image_url = new
                            {
                                url = $"data:{imageFile.ContentType};base64,{base64Image}"
                            }
                        }
                    }
                }
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

                return JsonSerializer.Deserialize<TaskVerificationResult>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }

            Console.WriteLine($"[Groq VisionService Error]: {jsonResponse}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Groq VisionService Exception]: {ex.Message}");
        }

        return new TaskVerificationResult
        {
            IsCompleted = false,
            Reasoning = "Không thể kết nối với máy chủ AI Vision lúc này."
        };
    }
}
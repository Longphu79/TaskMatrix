using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using TaskMatrix.Api.DTOs;

namespace TaskMatrix.Api.Services;

public class VisionService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    private static readonly Uri GroqEndpointUri = new Uri("https://api.groq.com/openai/v1/chat/completions", UriKind.Absolute);

    public VisionService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["Groq:ApiKey"] ?? throw new ArgumentNullException("Thiếu Groq API Key trong appsettings.json");
    }

    public async Task<AiProofResultDto?> VerifyTaskProofAsync(string taskTitle, string taskDescription, int currentProgress, IFormFile imageFile)
    {
        if (imageFile == null || imageFile.Length == 0) return null;

        using var ms = new MemoryStream();
        await imageFile.CopyToAsync(ms);
        var base64Image = Convert.ToBase64String(ms.ToArray());

        var prompt = $@"
Bạn là AI kiểm định bằng chứng hoàn thành công việc của hệ thống TaskMatrix.

THÔNG TIN CÔNG VIỆC:
- Tiêu đề: {taskTitle}
- Mô tả: {taskDescription}
- Tiến độ hiện tại của Task: {currentProgress}%

NHIỆM VỤ CỦA BẠN:
1. Quan sát bức ảnh minh chứng người dùng gửi lên.
2. Đánh giá xem ảnh có phải là bằng chứng hợp lệ cho công việc này hay không.
3. Đánh giá mức độ hoàn thành (% tiến độ thực tế từ 0 đến 100%). Nếu hoàn thành một phần, đặt partial = true.

QUY TẮC TRẢ VỀ JSON THUẦN TÚY (KHÔNG bọc markdown ```json):
{{
  ""ok"": true hoặc false (true nếu bằng chứng hợp lệ và có tiến độ),
  ""aiStatus"": ""verified"" (nếu đạt 100%) | ""needs"" (nếu cần làm thêm/hoàn thành 1 phần) | ""feedback"" (nếu ảnh không hợp lệ/bị từ chối),
  ""reasoning"": ""Lời giải thích chi tiết bằng tiếng Việt lý do phê duyệt hoặc lý do ghi nhận tiến độ."",
  ""feedback"": ""Nhận xét, góp ý lý do chưa đạt hoặc cần bổ sung gì thêm."",
  ""partial"": true hoặc false (true nếu công việc hoàn thành một phần, false nếu 100% hoặc từ chối),
  ""progress"": Số nguyên từ 0 đến 100 (Ví dụ: 50, 80, 100)
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

                if (string.IsNullOrEmpty(content)) return null;

                return JsonSerializer.Deserialize<AiProofResultDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }

            Console.WriteLine($"[Groq VisionService Error]: {jsonResponse}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Groq VisionService Exception]: {ex.Message}");
        }

        return new AiProofResultDto
        {
            Ok = false,
            AiStatus = "feedback",
            Reasoning = "Không thể kết nối với máy chủ AI Vision lúc này.",
            Feedback = "Hệ thống gián đoạn kết nối, vui lòng gửi lại ảnh minh chứng sau.",
            Partial = false,
            Progress = currentProgress
        };
    }
}
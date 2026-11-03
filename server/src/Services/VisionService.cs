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

    public async Task<AiProofResultDto?> VerifyTaskProofAsync(
        string taskTitle,
        string taskDescription,
        int currentProgress,
        IFormFile imageFile,
        string? userNotes = null)
    {
        if (imageFile == null || imageFile.Length == 0) return null;

        // 1. Đọc file ảnh sang Byte Array
        using var ms = new MemoryStream();
        await imageFile.CopyToAsync(ms);
        var imageBytes = ms.ToArray();

        // 🟢 2. Chuẩn hóa Base64: Loại bỏ ký tự xuống dòng thừa (nếu có)
        string base64Image = Convert.ToBase64String(imageBytes).Replace("\r", "").Replace("\n", "");

        // 🟢 3. Xác định MIME type chuẩn (fallback về image/jpeg nếu ContentType bị trống)
        string mimeType = "image/jpeg";
        if (!string.IsNullOrWhiteSpace(imageFile.ContentType) && imageFile.ContentType.Contains('/'))
        {
            mimeType = imageFile.ContentType.ToLower();
        }
        else
        {
            // Tự suy luận extension nếu ContentType không có
            var ext = Path.GetExtension(imageFile.FileName).ToLower();
            mimeType = ext switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "image/jpeg"
            };
        }

        // 🟢 4. Ghép thành chuỗi Data URI chuẩn tuyệt đối
        string imageDataUrl = $"data:{mimeType};base64,{base64Image}";

        var prompt = $@"
Bạn là AI kiểm định bằng chứng hoàn thành công việc của hệ thống TaskMatrix.

THÔNG TIN CÔNG VIỆC:
- Tiêu đề: {taskTitle}
- Mô tả: {taskDescription}
- Tiến độ người dùng khai báo: {currentProgress}%
- Ghi chú/Lời nhắn từ người dùng: {(string.IsNullOrWhiteSpace(userNotes) ? "Không có" : userNotes)}

NHIỆM VỤ CỦA BẠN:
1. Quan sát kỹ bức ảnh minh chứng người dùng gửi lên.
2. Đánh giá xem ảnh có phải là bằng chứng hợp lệ cho công việc này hay không.
3. Đánh giá mức độ hoàn thành (% tiến độ thực tế từ 0 đến 100%).

BẮT BUỘC TRẢ VỀ DẠNG JSON THUẦN TÚY KHÔNG BỌC MARKDOWN:
{{
  ""ok"": true/false (true nếu bằng chứng hợp lệ và thể hiện công việc đạt tiến độ),
  ""aiStatus"": ""verified"" (nếu đạt 100%) | ""needs"" (nếu đạt một phần) | ""feedback"" (nếu ảnh không hợp lệ/bị từ chối),
  ""reasoning"": ""Giải thích ngắn gọn, rõ ràng bằng tiếng Việt lý do đánh giá."",
  ""feedback"": ""Góp ý hoặc yêu cầu bổ sung nếu chưa đạt."",
  ""partial"": true/false (true nếu hoàn thành 1 phần, false nếu 100% hoặc từ chối),
  ""progress"": Số nguyên từ 0 đến 100
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
                                url = imageDataUrl
                            }
                        }
                    }
                }
            },
            temperature = 0.2
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
            Reasoning = "Không thể kết nối hoặc phân tích ảnh qua máy chủ AI Vision lúc này.",
            Feedback = "Vui lòng kiểm tra lại định dạng ảnh và gửi lại.",
            Partial = false,
            Progress = currentProgress
        };
    }
}
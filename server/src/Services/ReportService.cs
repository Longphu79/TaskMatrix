using System.Globalization;
using System.Text;
using MongoDB.Driver;
using TaskMatrix.Api.DTOs;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public class ReportService
{
    private readonly IMongoCollection<TaskItem> _tasks;

    public ReportService(IMongoDatabase database)
    {
        _tasks = database.GetCollection<TaskItem>("tasks");
    }

    public static bool IsSupportedFormat(string format) =>
        format.Equals("PDF", StringComparison.OrdinalIgnoreCase) ||
        format.Equals("CSV", StringComparison.OrdinalIgnoreCase);

    public static bool IsSupportedType(string reportType) =>
        reportType is "attendance" or "progress" or "utilization";

    public async Task<ReportExportFile> CreateExportAsync(
        string userId,
        ReportExportRequest request)
    {
        var from = DateTime.SpecifyKind(request.FromDate.Date, DateTimeKind.Utc);
        var through = DateTime.SpecifyKind(request.ToDate.Date.AddDays(1), DateTimeKind.Utc);
        var filter = Builders<TaskItem>.Filter.And(
            Builders<TaskItem>.Filter.Eq(task => task.UserId, userId),
            Builders<TaskItem>.Filter.Gte(task => task.CreatedAt, from),
            Builders<TaskItem>.Filter.Lt(task => task.CreatedAt, through));

        if (!string.IsNullOrWhiteSpace(request.WorkspaceId))
        {
            filter &= Builders<TaskItem>.Filter.Eq(task => task.WorkspaceId, request.WorkspaceId);
        }

        if (!string.IsNullOrWhiteSpace(request.Project) &&
            !request.Project.Equals("All Projects", StringComparison.OrdinalIgnoreCase))
        {
            filter &= Builders<TaskItem>.Filter.Regex(
                task => task.Description,
                new MongoDB.Bson.BsonRegularExpression(
                    $"^Project:\\s*{System.Text.RegularExpressions.Regex.Escape(request.Project)}\\s*$",
                    "i"));
        }

        if (request.Member == "me")
        {
            filter &= Builders<TaskItem>.Filter.Eq(task => task.AssignedTo, userId);
        }

        var tasks = await _tasks.Find(filter)
            .SortBy(task => task.CreatedAt)
            .ToListAsync();

        var reportTitle = GetReportTitle(request.ReportType);
        var fileName = $"taskmatrix-{request.ReportType}-{DateTime.UtcNow:yyyyMMdd-HHmmss}.{request.Format.ToLowerInvariant()}";
        var content = request.Format.Equals("PDF", StringComparison.OrdinalIgnoreCase)
            ? CreatePdf(reportTitle, tasks, request)
            : CreateCsv(reportTitle, tasks, request);

        return new ReportExportFile(fileName, content);
    }

    private static string GetReportTitle(string reportType) => reportType switch
    {
        "progress" => "Project Progress Summary",
        "utilization" => "Team Utilization",
        _ => "Time and Attendance Report",
    };

    private static byte[] CreateCsv(
        string title,
        IReadOnlyCollection<TaskItem> tasks,
        ReportExportRequest request)
    {
        var builder = new StringBuilder();
        builder.AppendLine(CsvRow("Report", title));
        builder.AppendLine(CsvRow("Date range", $"{request.FromDate:yyyy-MM-dd} to {request.ToDate:yyyy-MM-dd}"));
        builder.AppendLine(CsvRow("Project", request.Project ?? "All Projects"));
        builder.AppendLine();
        builder.AppendLine(CsvRow(
            "Task",
            "Project",
            "Status",
            "Priority",
            "Created date",
            "Due date",
            "Estimated hours",
            "Actual hours"));

        foreach (var task in tasks)
        {
            builder.AppendLine(CsvRow(
                task.Title,
                GetProject(task),
                task.Status,
                task.Priority,
                task.CreatedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                task.DueDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "",
                (task.EstimatedMinutes.GetValueOrDefault() / 60d).ToString("0.##", CultureInfo.InvariantCulture),
                (task.ActualMinutes / 60d).ToString("0.##", CultureInfo.InvariantCulture)));
        }

        return new UTF8Encoding(encoderShouldEmitUTF8Identifier: true).GetBytes(builder.ToString());
    }

    private static string CsvRow(params string?[] values) =>
        string.Join(",", values.Select(value =>
        {
            var safeValue = value ?? "";
            if (safeValue.Length > 0 && "=+-@\t\r".Contains(safeValue[0]))
            {
                safeValue = $"'{safeValue}";
            }

            return $"\"{safeValue.Replace("\"", "\"\"")}\"";
        }));

    private static byte[] CreatePdf(
        string title,
        IReadOnlyCollection<TaskItem> tasks,
        ReportExportRequest request)
    {
        var lines = new List<string>
        {
            title,
            $"Date range: {request.FromDate:yyyy-MM-dd} to {request.ToDate:yyyy-MM-dd}",
            $"Project: {request.Project ?? "All Projects"}",
            $"Tasks included: {tasks.Count}",
            "",
            "Task | Project | Status | Priority | Created | Due | Est. hours | Actual hours",
        };

        lines.AddRange(tasks.Select(task => string.Join(" | ",
        [
            task.Title,
            GetProject(task),
            task.Status,
            task.Priority,
            task.CreatedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            task.DueDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "-",
            (task.EstimatedMinutes.GetValueOrDefault() / 60d).ToString("0.##", CultureInfo.InvariantCulture),
            (task.ActualMinutes / 60d).ToString("0.##", CultureInfo.InvariantCulture),
        ])));

        return BuildPdf(lines.Select(ToPdfAscii).ToList());
    }

    private static string GetProject(TaskItem task)
    {
        const string prefix = "Project:";
        if (task.Description?.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) == true)
        {
            return task.Description[prefix.Length..].Trim();
        }

        return "-";
    }

    private static string ToPdfAscii(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var ascii = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            ascii.Append(character <= 0x7f ? character : '?');
        }

        return ascii.ToString();
    }

    private static byte[] BuildPdf(IReadOnlyList<string> lines)
    {
        const int linesPerPage = 42;
        var pages = lines.Chunk(linesPerPage).ToList();
        if (pages.Count == 0)
        {
            pages.Add([]);
        }

        var objects = new List<byte[]>();
        objects.Add(Encoding.ASCII.GetBytes("<< /Type /Catalog /Pages 2 0 R >>"));
        var pageReferences = string.Join(" ", Enumerable.Range(0, pages.Count)
            .Select(index => $"{4 + index * 2} 0 R"));
        objects.Add(Encoding.ASCII.GetBytes(
            $"<< /Type /Pages /Kids [{pageReferences}] /Count {pages.Count} >>"));
        objects.Add(Encoding.ASCII.GetBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"));

        for (var index = 0; index < pages.Count; index++)
        {
            var pageObjectNumber = 4 + index * 2;
            var streamObjectNumber = pageObjectNumber + 1;
            var content = new StringBuilder("BT\n/F1 9 Tf\n50 760 Td\n");
            for (var lineIndex = 0; lineIndex < pages[index].Length; lineIndex++)
            {
                if (lineIndex > 0)
                {
                    content.Append("0 -16 Td\n");
                }

                content.Append('(')
                    .Append(pages[index][lineIndex]
                        .Replace("\\", "\\\\")
                        .Replace("(", "\\(")
                        .Replace(")", "\\)"))
                    .Append(") Tj\n");
            }
            content.Append("ET");

            var streamBytes = Encoding.ASCII.GetBytes(content.ToString());
            objects.Add(Encoding.ASCII.GetBytes(
                $"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {streamObjectNumber} 0 R >>"));
            using var streamObject = new MemoryStream();
            var streamHeader = Encoding.ASCII.GetBytes($"<< /Length {streamBytes.Length} >>\nstream\n");
            streamObject.Write(streamHeader);
            streamObject.Write(streamBytes);
            streamObject.Write(Encoding.ASCII.GetBytes("\nendstream"));
            objects.Add(streamObject.ToArray());
        }

        using var pdf = new MemoryStream();
        WriteAscii(pdf, "%PDF-1.4\n");
        var offsets = new List<long> { 0 };
        for (var index = 0; index < objects.Count; index++)
        {
            offsets.Add(pdf.Position);
            WriteAscii(pdf, $"{index + 1} 0 obj\n");
            pdf.Write(objects[index]);
            WriteAscii(pdf, "\nendobj\n");
        }

        var xrefOffset = pdf.Position;
        WriteAscii(pdf, $"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1))
        {
            WriteAscii(pdf, $"{offset:0000000000} 00000 n \n");
        }
        WriteAscii(pdf, $"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xrefOffset}\n%%EOF");
        return pdf.ToArray();
    }

    private static void WriteAscii(Stream stream, string value) =>
        stream.Write(Encoding.ASCII.GetBytes(value));
}

public record ReportExportFile(string FileName, byte[] Content);

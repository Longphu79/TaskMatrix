using System.Globalization;
using System.Text;
using MongoDB.Bson;
using MongoDB.Driver;
using TaskMatrix.Api.DTO.Report;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public sealed class ReportService
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
        var toExclusive = DateTime.SpecifyKind(
            request.ToDate.Date.AddDays(1),
            DateTimeKind.Utc);
        var filter = Builders<TaskItem>.Filter.And(
            Builders<TaskItem>.Filter.Eq(task => task.UserId, userId),
            Builders<TaskItem>.Filter.Gte(task => task.CreatedAt, from),
            Builders<TaskItem>.Filter.Lt(task => task.CreatedAt, toExclusive));

        if (!string.IsNullOrWhiteSpace(request.Project) &&
            !request.Project.Equals(
                "All Projects",
                StringComparison.OrdinalIgnoreCase))
        {
            var escapedProject =
                System.Text.RegularExpressions.Regex.Escape(request.Project);
            filter &= Builders<TaskItem>.Filter.Regex(
                task => task.Description,
                new BsonRegularExpression(
                    $"^Project:\\s*{escapedProject}\\s*$",
                    "i"));
        }

        var tasks = await _tasks.Find(filter)
            .SortBy(task => task.CreatedAt)
            .ToListAsync();

        var title = GetTitle(request.ReportType);
        var extension = request.Format.ToLowerInvariant();
        var fileName =
            $"taskmatrix-{request.ReportType}-{DateTime.UtcNow:yyyyMMdd-HHmmss}.{extension}";
        var content = extension == "pdf"
            ? CreatePdf(title, tasks, request)
            : CreateCsv(title, tasks, request);

        return new ReportExportFile(fileName, content);
    }

    private static string GetTitle(string reportType) => reportType switch
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
        var output = new StringBuilder();
        output.AppendLine(CsvRow("Report", title));
        output.AppendLine(CsvRow(
            "Date range",
            $"{request.FromDate:yyyy-MM-dd} to {request.ToDate:yyyy-MM-dd}"));
        output.AppendLine(CsvRow("Project", request.Project ?? "All Projects"));
        output.AppendLine(CsvRow(
            "Tasks included",
            tasks.Count.ToString(CultureInfo.InvariantCulture)));
        output.AppendLine();
        output.AppendLine(CsvRow(
            "Task",
            "Project",
            "Status",
            "Priority",
            "Created date",
            "Due date",
            "Estimated hours"));

        foreach (var task in tasks)
        {
            output.AppendLine(CsvRow(
                task.Title,
                GetProject(task),
                task.Status,
                task.Priority,
                task.CreatedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                task.DueDate?.ToString(
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture) ?? "",
                (task.EstimatedMinutes.GetValueOrDefault() / 60d)
                    .ToString("0.##", CultureInfo.InvariantCulture)));
        }

        return new UTF8Encoding(encoderShouldEmitUTF8Identifier: true)
            .GetBytes(output.ToString());
    }

    private static string CsvRow(params string?[] values) =>
        string.Join(",", values.Select(value =>
        {
            var text = value ?? "";
            if (text.Length > 0 && "=+-@\t\r".Contains(text[0]))
            {
                text = $"'{text}";
            }

            return $"\"{text.Replace("\"", "\"\"")}\"";
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
            "Task | Project | Status | Priority | Created | Due | Est. hours",
        };

        lines.AddRange(tasks.Select(task => string.Join(
            " | ",
            task.Title,
            GetProject(task),
            task.Status,
            task.Priority,
            task.CreatedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            task.DueDate?.ToString(
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture) ?? "-",
            (task.EstimatedMinutes.GetValueOrDefault() / 60d)
                .ToString("0.##", CultureInfo.InvariantCulture))));

        return BuildPdf(lines.Select(ToPdfAscii).ToList());
    }

    private static string GetProject(TaskItem task)
    {
        const string prefix = "Project:";
        return task.Description?.StartsWith(
            prefix,
            StringComparison.OrdinalIgnoreCase) == true
            ? task.Description[prefix.Length..].Trim()
            : "-";
    }

    private static string ToPdfAscii(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var output = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) ==
                UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            output.Append(character <= 0x7f ? character : '?');
        }

        return output.ToString();
    }

    private static byte[] BuildPdf(IReadOnlyList<string> lines)
    {
        const int linesPerPage = 42;
        var pages = lines.Chunk(linesPerPage).ToList();
        if (pages.Count == 0)
        {
            pages.Add(Array.Empty<string>());
        }

        var objects = new List<byte[]>
        {
            Encoding.ASCII.GetBytes("<< /Type /Catalog /Pages 2 0 R >>"),
            Encoding.ASCII.GetBytes(
                $"<< /Type /Pages /Kids [{string.Join(" ", Enumerable.Range(0, pages.Count).Select(index => $"{4 + index * 2} 0 R"))}] /Count {pages.Count} >>"),
            Encoding.ASCII.GetBytes(
                "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
        };

        foreach (var (page, index) in pages.Select((page, index) =>
                     (page, index)))
        {
            var pageObjectNumber = 4 + index * 2;
            var streamObjectNumber = pageObjectNumber + 1;
            var content = new StringBuilder("BT\n/F1 9 Tf\n50 760 Td\n");
            for (var lineIndex = 0; lineIndex < page.Length; lineIndex++)
            {
                if (lineIndex > 0)
                {
                    content.Append("0 -16 Td\n");
                }

                content.Append('(')
                    .Append(page[lineIndex]
                        .Replace("\\", "\\\\")
                        .Replace("(", "\\(")
                        .Replace(")", "\\)"))
                    .Append(") Tj\n");
            }
            content.Append("ET");

            var stream = Encoding.ASCII.GetBytes(content.ToString());
            objects.Add(Encoding.ASCII.GetBytes(
                $"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {streamObjectNumber} 0 R >>"));

            using var streamObject = new MemoryStream();
            WriteAscii(streamObject, $"<< /Length {stream.Length} >>\nstream\n");
            streamObject.Write(stream);
            WriteAscii(streamObject, "\nendstream");
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
        WriteAscii(
            pdf,
            $"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xrefOffset}\n%%EOF");

        return pdf.ToArray();
    }

    private static void WriteAscii(Stream stream, string value) =>
        stream.Write(Encoding.ASCII.GetBytes(value));
}

public sealed record ReportExportFile(string FileName, byte[] Content);

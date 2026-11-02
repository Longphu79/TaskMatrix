using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver.GridFS;
using System.Security.Claims;
using TaskMatrix.Api.DTO.Document;
using TaskMatrix.Api.Models;
using TaskMatrix.Api.Services;

namespace TaskMatrix.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public sealed class DocumentsController(IDocumentService documentService) : ControllerBase
{
    private const long MaxFileSize = 25 * 1024 * 1024;

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<DocumentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<DocumentResponse>>> GetMyDocuments(
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var documents = await documentService.GetByUserIdAsync(userId, cancellationToken);
        return Ok(documents.Select(ToResponse).ToList());
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentResponse>> GetDocumentById(
        string id,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var document = await documentService.GetByIdAsync(id, userId, cancellationToken);
        return document is null ? NotFound() : Ok(ToResponse(document));
    }

    [HttpPost]
    [RequestSizeLimit(MaxFileSize)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<DocumentResponse>> CreateDocument(
        [FromForm] CreateDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (request.File is null || request.File.Length == 0)
        {
            ModelState.AddModelError(nameof(request.File), "A document file is required.");
            return ValidationProblem(ModelState);
        }

        if (request.File.Length > MaxFileSize)
        {
            return BadRequest(new { message = "Files must be 25 MB or smaller." });
        }

        if (request.Start is not { } start ||
            request.Deadline is not { } deadline)
        {
            return BadRequest(new { message = "Start and deadline are required." });
        }

        if (deadline < start)
        {
            return BadRequest(new { message = "Deadline must be after the start date." });
        }

        var document = new DocumentItem
        {
            UserId = userId,
            FileName = Path.GetFileName(request.File.FileName),
            ContentType = string.IsNullOrWhiteSpace(request.File.ContentType)
                ? "application/octet-stream"
                : request.File.ContentType,
            Size = request.File.Length,
            Title = request.Title.Trim(),
            Category = request.Category.Trim(),
            Progress = request.Progress,
            Start = start.UtcDateTime,
            Deadline = deadline.UtcDateTime,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await using var contents = request.File.OpenReadStream();
        await documentService.CreateAsync(document, contents, cancellationToken);

        return CreatedAtAction(
            nameof(GetDocumentById),
            new { id = document.Id },
            ToResponse(document));
    }

    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentResponse>> UpdateDocument(
        string id,
        [FromForm] UpdateDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (request.Start is not { } start ||
            request.Deadline is not { } deadline)
        {
            return BadRequest(new { message = "Start and deadline are required." });
        }

        if (deadline < start)
        {
            return BadRequest(new { message = "Deadline must be after the start date." });
        }

        var document = await documentService.GetByIdAsync(id, userId, cancellationToken);
        if (document is null)
        {
            return NotFound(new { message = "Document not found." });
        }

        document.Title = request.Title.Trim();
        document.Category = request.Category.Trim();
        document.Progress = request.Progress;
        document.Start = start.UtcDateTime;
        document.Deadline = deadline.UtcDateTime;
        document.UpdatedAt = DateTime.UtcNow;

        if (!await documentService.UpdateAsync(document, cancellationToken))
        {
            return NotFound(new { message = "Document not found." });
        }

        return Ok(ToResponse(document));
    }

    [HttpPatch("{id}/progress")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentResponse>> UpdateProgress(
        string id,
        UpdateDocumentProgressRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var document = await documentService.GetByIdAsync(id, userId, cancellationToken);
        if (document is null)
        {
            return NotFound(new { message = "Document not found." });
        }

        document.Progress = request.Progress;
        document.UpdatedAt = DateTime.UtcNow;
        if (!await documentService.UpdateAsync(document, cancellationToken))
        {
            return NotFound(new { message = "Document not found." });
        }

        return Ok(ToResponse(document));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(
        string id,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var document = await documentService.GetByIdAsync(id, userId, cancellationToken);
        if (document is null ||
            !await documentService.DeleteAsync(document, cancellationToken))
        {
            return NotFound(new { message = "Document not found." });
        }

        return NoContent();
    }

    [HttpGet("{id}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDocument(
        string id,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var document = await documentService.GetByIdAsync(id, userId, cancellationToken);
        if (document is null)
        {
            return NotFound(new { message = "Document not found." });
        }

        try
        {
            var file = await documentService.OpenDownloadStreamAsync(
                document.FileId,
                cancellationToken);
            return File(file, document.ContentType, document.FileName);
        }
        catch (GridFSFileNotFoundException)
        {
            return NotFound(new { message = "Document file not found." });
        }
    }

    private static DocumentResponse ToResponse(DocumentItem document)
    {
        return new DocumentResponse(
            document.Id!,
            document.Title,
            document.FileName,
            Path.GetExtension(document.FileName).TrimStart('.').ToUpperInvariant(),
            document.Category,
            document.Progress,
            new DateTimeOffset(DateTime.SpecifyKind(document.Start, DateTimeKind.Utc)),
            new DateTimeOffset(DateTime.SpecifyKind(document.Deadline, DateTimeKind.Utc)),
            document.Size,
            document.ContentType,
            new DateTimeOffset(DateTime.SpecifyKind(document.CreatedAt, DateTimeKind.Utc)),
            new DateTimeOffset(DateTime.SpecifyKind(document.UpdatedAt, DateTimeKind.Utc)));
    }

}

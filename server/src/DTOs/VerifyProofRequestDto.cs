// TaskMatrix.Api.DTOs/VerifyProofRequestDto.cs
public class VerifyProofRequestDto
{
    public IFormFile ProofImage { get; set; } = null!;
    public string? UserNotes { get; set; }
    public int? ClaimedProgress { get; set; }
}
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public sealed class DocumentService(IMongoDatabase database) : IDocumentService
{
    private const string CollectionName = "documents";
    private readonly IMongoCollection<DocumentItem> _documents =
        database.GetCollection<DocumentItem>(CollectionName);
    private readonly GridFSBucket<ObjectId> _files = new(database);

    public async Task<List<DocumentItem>> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        return await _documents
            .Find(document => document.UserId == userId)
            .SortByDescending(document => document.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<DocumentItem?> GetByIdAsync(
        string id,
        string userId,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return null;
        }

        return await _documents
            .Find(document => document.Id == id && document.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task CreateAsync(
        DocumentItem document,
        Stream contents,
        CancellationToken cancellationToken)
    {
        document.FileId = ObjectId.GenerateNewId();
        await _files.UploadFromStreamAsync(
            document.FileId,
            document.FileName,
            contents,
            cancellationToken: cancellationToken);

        try
        {
            await _documents.InsertOneAsync(
                document,
                cancellationToken: cancellationToken);
        }
        catch
        {
            await _files.DeleteAsync(
                document.FileId,
                cancellationToken);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(
        DocumentItem document,
        CancellationToken cancellationToken)
    {
        var result = await _documents.ReplaceOneAsync(
            item => item.Id == document.Id && item.UserId == document.UserId,
            document,
            cancellationToken: cancellationToken);

        return result.MatchedCount > 0;
    }

    public async Task<bool> DeleteAsync(
        DocumentItem document,
        CancellationToken cancellationToken)
    {
        var result = await _documents.DeleteOneAsync(
            item => item.Id == document.Id && item.UserId == document.UserId,
            cancellationToken);

        if (result.DeletedCount == 0)
        {
            return false;
        }

        await _files.DeleteAsync(document.FileId, cancellationToken);
        return true;
    }

    public Task<GridFSDownloadStream<ObjectId>> OpenDownloadStreamAsync(
        ObjectId fileId,
        CancellationToken cancellationToken)
    {
        return _files.OpenDownloadStreamAsync(
            fileId,
            cancellationToken: cancellationToken);
    }
}

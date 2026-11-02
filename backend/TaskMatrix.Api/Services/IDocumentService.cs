using MongoDB.Bson;
using MongoDB.Driver.GridFS;
using TaskMatrix.Api.Models;

namespace TaskMatrix.Api.Services;

public interface IDocumentService
{
    Task<List<DocumentItem>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);

    Task<DocumentItem?> GetByIdAsync(string id, string userId, CancellationToken cancellationToken);

    Task CreateAsync(DocumentItem document, Stream contents, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(DocumentItem document, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(DocumentItem document, CancellationToken cancellationToken);

    Task<GridFSDownloadStream<ObjectId>> OpenDownloadStreamAsync(
        ObjectId fileId,
        CancellationToken cancellationToken);
}

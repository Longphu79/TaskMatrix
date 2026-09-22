namespace TaskMatrix.Api.Settings
{
    public sealed class MongoDbSettings
    {
        public const string SectionName = "MongoDbSettings";
        public string ConnectionString { get; set; } = string.Empty;

        public string DatabaseName { get; set; } = string.Empty;
    }
}

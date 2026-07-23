namespace CompanyProjectManagement.Domain.Exceptions;

/// <summary>
/// Exception thrown when a requested entity is not found in the system.
/// Maps to HTTP 404 Not Found.
/// </summary>
public class EntityNotFoundException : Exception
{
    public EntityNotFoundException()
        : base("El recurso solicitado no fue encontrado.")
    {
    }

    public EntityNotFoundException(string message)
        : base(message)
    {
    }

    public EntityNotFoundException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

    public EntityNotFoundException(string entityName, object id)
        : base($"La entidad '{entityName}' con identificador '{id}' no fue encontrada.")
    {
    }
}

namespace CompanyProjectManagement.Domain.Exceptions;

/// <summary>
/// Exception thrown when an operation violates referential integrity constraints,
/// such as attempting to delete an entity that has dependent records.
/// Maps to HTTP 409 Conflict.
/// </summary>
public class ReferentialIntegrityException : Exception
{
    public ReferentialIntegrityException()
        : base("No se puede completar la operación debido a restricciones de integridad referencial.")
    {
    }

    public ReferentialIntegrityException(string message)
        : base(message)
    {
    }

    public ReferentialIntegrityException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

    public ReferentialIntegrityException(string entityName, string dependentEntityName)
        : base($"No se puede eliminar la entidad '{entityName}' porque tiene registros de '{dependentEntityName}' asociados.")
    {
    }
}

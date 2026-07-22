namespace CompanyProjectManagement.Domain.Exceptions;

/// <summary>
/// Exception thrown when attempting to create or update an entity with a duplicate
/// identification or name that must be unique.
/// Maps to HTTP 409 Conflict.
/// </summary>
public class DuplicateIdentificationException : Exception
{
    public DuplicateIdentificationException()
        : base("Ya existe un registro con la misma identificación.")
    {
    }

    public DuplicateIdentificationException(string message)
        : base(message)
    {
    }

    public DuplicateIdentificationException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

    public DuplicateIdentificationException(string entityName, string fieldName, string value)
        : base($"Ya existe una entidad '{entityName}' con el valor '{value}' en el campo '{fieldName}'.")
    {
    }
}

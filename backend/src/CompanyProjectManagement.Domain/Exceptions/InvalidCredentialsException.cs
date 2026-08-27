namespace CompanyProjectManagement.Domain.Exceptions;

/// <summary>
/// Exception thrown when authentication fails due to invalid credentials
/// (nonexistent username or incorrect password).
/// Maps to HTTP 401 Unauthorized. Uses a generic message so it does not reveal
/// whether the username or the password was the failing factor.
/// </summary>
public class InvalidCredentialsException : Exception
{
    public InvalidCredentialsException()
        : base("Usuario o contraseña incorrectos.")
    {
    }

    public InvalidCredentialsException(string message)
        : base(message)
    {
    }

    public InvalidCredentialsException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

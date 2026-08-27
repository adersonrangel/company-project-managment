namespace CompanyProjectManagement.Application.Services;

public interface IPasswordHasher
{
    (string Hash, string Salt) Hash(string password);      // Req 4.2
    bool Verify(string password, string hash, string salt); // Req 4.3
}

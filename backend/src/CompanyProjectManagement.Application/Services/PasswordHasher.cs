using System.Security.Cryptography;

namespace CompanyProjectManagement.Application.Services;

/// <summary>
/// Deriva y verifica hashes de contraseña usando PBKDF2 (Rfc2898DeriveBytes) con SHA-256,
/// un número fijo de iteraciones y una sal aleatoria por usuario almacenada en Base64.
/// La contraseña en texto plano nunca se persiste; solo se retienen el hash y la sal.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int Iterations = 100_000;
    private const int SaltSizeBytes = 16;
    private const int HashSizeBytes = 32;
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    // Req 4.2: genera hash + sal; la contraseña en claro se descarta al retornar.
    public (string Hash, string Salt) Hash(string password)
    {
        ArgumentNullException.ThrowIfNull(password);

        var saltBytes = RandomNumberGenerator.GetBytes(SaltSizeBytes);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
            password,
            saltBytes,
            Iterations,
            Algorithm,
            HashSizeBytes);

        return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
    }

    // Req 4.3: verifica la contraseña contra el hash almacenado usando la sal asociada.
    public bool Verify(string password, string hash, string salt)
    {
        ArgumentNullException.ThrowIfNull(password);
        ArgumentNullException.ThrowIfNull(hash);
        ArgumentNullException.ThrowIfNull(salt);

        byte[] saltBytes;
        byte[] expectedHashBytes;
        try
        {
            saltBytes = Convert.FromBase64String(salt);
            expectedHashBytes = Convert.FromBase64String(hash);
        }
        catch (FormatException)
        {
            return false;
        }

        var actualHashBytes = Rfc2898DeriveBytes.Pbkdf2(
            password,
            saltBytes,
            Iterations,
            Algorithm,
            expectedHashBytes.Length);

        return CryptographicOperations.FixedTimeEquals(actualHashBytes, expectedHashBytes);
    }
}

using CompanyProjectManagement.Application.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Property-based tests for <see cref="PasswordHasher"/>.
///
/// Feature: authentication-login-jwt, Property 8: El hash no expone la contraseña en claro
/// Feature: authentication-login-jwt, Property 9: Round-trip de verificación de contraseña
/// </summary>
public class PasswordHasherPropertyTests
{
    private static readonly IPasswordHasher Hasher = new PasswordHasher();

    // Printable visible ASCII chars used to build password values.
    private static readonly Gen<char> PrintableCharGen =
        Gen.Choose(33, 126).Select(i => (char)i);

    /// <summary>
    /// Minimum password length used by the "does not leak plaintext" property. This matches
    /// the application's password policy (>= 8 characters). Very short passwords (e.g. a single
    /// character) are excluded because a short string is coincidentally a substring of a 44-char
    /// Base64 hash with near-certain probability, which carries no information about the password
    /// and would make the "does not contain" check meaningless rather than a real leak.
    /// </summary>
    private const int MinMeaningfulPasswordLength = 8;

    /// <summary>
    /// Generates passwords (length 8-128) of printable ASCII characters. The lower bound keeps
    /// the substring "does not leak" check meaningful; see <see cref="MinMeaningfulPasswordLength"/>.
    /// </summary>
    private static Gen<string> NonEmptyPassword() =>
        Gen.Choose(MinMeaningfulPasswordLength, 128)
            .SelectMany(len => Gen.ArrayOf(PrintableCharGen, len))
            .Select(chars => new string(chars));

    /// <summary>
    /// Generates arbitrary passwords including the empty string (length 0-128).
    /// </summary>
    private static Gen<string> AnyPassword() =>
        Gen.Choose(0, 128)
            .SelectMany(len => Gen.ArrayOf(PrintableCharGen, len))
            .Select(chars => new string(chars));

    // Feature: authentication-login-jwt, Property 8: El hash no expone la contraseña en claro
    //
    // Para cualquier contraseña, PasswordHasher.Hash produce un par (hash, sal) no vacío
    // en el que el hash no es igual a la contraseña en texto plano ni la contiene.
    //
    // **Validates: Requirements 4.2**
    /// <summary>
    /// For any non-empty password, Hash produces a non-empty (hash, salt) pair where the
    /// hash is not equal to the plaintext password and does not contain it as a substring.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Hash_DoesNotExposePlaintextPassword()
    {
        return Prop.ForAll(
            NonEmptyPassword().ToArbitrary(),
            password =>
            {
                var (hash, salt) = Hasher.Hash(password);

                hash.Should().NotBeNullOrEmpty("the derived hash must be a non-empty value");
                salt.Should().NotBeNullOrEmpty("the salt must be a non-empty value");
                hash.Should().NotBe(password, "the hash must not equal the plaintext password");
                hash.Should().NotContain(password, "the hash must not leak the plaintext password");
            });
    }

    // Feature: authentication-login-jwt, Property 9: Round-trip de verificación de contraseña
    //
    // Para cualquier contraseña pw, Verify(pw, Hash(pw)) es verdadero; y para cualquier par
    // de contraseñas distintas pw != pw', Verify(pw', Hash(pw)) es falso.
    //
    // **Validates: Requirements 4.3**
    /// <summary>
    /// For any password, verifying it against its own freshly generated hash and salt succeeds.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Verify_SucceedsForMatchingPassword()
    {
        return Prop.ForAll(
            AnyPassword().ToArbitrary(),
            password =>
            {
                var (hash, salt) = Hasher.Hash(password);

                Hasher.Verify(password, hash, salt)
                    .Should().BeTrue("a password must verify against its own hash and salt");
            });
    }

    // Feature: authentication-login-jwt, Property 9: Round-trip de verificación de contraseña
    //
    // **Validates: Requirements 4.3**
    /// <summary>
    /// For any two distinct passwords, verifying one against the other's hash and salt fails.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Verify_FailsForDifferentPassword()
    {
        return Prop.ForAll(
            AnyPassword().ToArbitrary(),
            AnyPassword().ToArbitrary(),
            (password, otherPassword) =>
            {
                // Only meaningful when the two passwords actually differ.
                return (password != otherPassword).Implies(() =>
                {
                    var (hash, salt) = Hasher.Hash(password);

                    Hasher.Verify(otherPassword, hash, salt)
                        .Should().BeFalse("a different password must not verify against another's hash");
                });
            });
    }
}

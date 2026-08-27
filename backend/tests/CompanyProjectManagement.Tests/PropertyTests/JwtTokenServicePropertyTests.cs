using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CompanyProjectManagement.Application.Options;
using CompanyProjectManagement.Application.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Property-based and example tests for <see cref="JwtTokenService"/>.
///
/// Feature: authentication-login-jwt, Property 1: Round-trip de firma del token
/// Feature: authentication-login-jwt, Property 2: Vigencia del token dentro de la tolerancia
/// Feature: authentication-login-jwt, Property 3: Round-trip de claims
/// Feature: authentication-login-jwt, Property 4: Datos de usuario vacíos impiden la emisión
/// </summary>
public class JwtTokenServicePropertyTests
{
    // Fixed test secret keys long enough for HMAC-SHA256 (>= 256 bits / 32 bytes).
    private const string TestSecretKey = "test-secret-key-with-at-least-32-bytes-of-length!!";
    private const string OtherSecretKey = "another-different-secret-key-32-bytes-minimum-000!!";
    private const string TestIssuer = "CompanyProjectManagement";
    private const string TestAudience = "CompanyProjectManagementClient";

    private static JwtTokenService CreateService(string secretKey = TestSecretKey)
    {
        var options = Options.Create(new JwtOptions
        {
            SecretKey = secretKey,
            Issuer = TestIssuer,
            Audience = TestAudience,
            ExpirationMinutes = 60
        });

        return new JwtTokenService(options);
    }

    // Printable visible ASCII chars used to build non-empty field values.
    private static readonly Gen<char> PrintableCharGen =
        Gen.Choose(33, 126).Select(i => (char)i);

    /// <summary>
    /// Generates non-empty, non-whitespace strings (length 1-64) of printable ASCII chars.
    /// Suitable for userId and username values that the service must accept.
    /// </summary>
    private static Gen<string> NonEmptyValue() =>
        Gen.Choose(1, 64)
            .SelectMany(len => Gen.ArrayOf(PrintableCharGen, len))
            .Select(chars => new string(chars));

    /// <summary>
    /// Generates empty or whitespace-only strings that must be rejected as user data.
    /// </summary>
    private static Gen<string> EmptyOrWhitespaceValue() =>
        Gen.OneOf(
            Gen.Constant(string.Empty),
            Gen.Constant(" "),
            Gen.Constant("   "),
            Gen.Constant("\t"),
            Gen.Constant("\n"),
            Gen.Constant(" \t\n "));

    private static TokenValidationParameters ValidationParameters(string secretKey) => new()
    {
        ValidateIssuer = true,
        ValidIssuer = TestIssuer,
        ValidateAudience = true,
        ValidAudience = TestAudience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };

    // Feature: authentication-login-jwt, Property 1: Round-trip de firma del token
    //
    // Para cualquier par (userId, username) no vacíos, un token generado por JwtTokenService
    // con la SecretKey configurada se valida correctamente con esa misma clave y es rechazado
    // al validarse con una clave distinta.
    //
    // **Validates: Requirements 2.1**
    /// <summary>
    /// For any non-empty (userId, username), the generated token validates successfully with
    /// the configured signing key and is rejected when validated with a different key.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Token_ValidatesWithConfiguredKey_AndIsRejectedWithDifferentKey()
    {
        return Prop.ForAll(
            NonEmptyValue().ToArbitrary(),
            NonEmptyValue().ToArbitrary(),
            (userId, username) =>
            {
                var service = CreateService();
                var result = service.GenerateToken(userId, username);

                var handler = new JwtSecurityTokenHandler();

                // Validates successfully with the same key.
                var validate = () => handler.ValidateToken(
                    result.Token, ValidationParameters(TestSecretKey), out _);
                validate.Should().NotThrow("the token must validate with the configured signing key");

                // Rejected when validated with a different key.
                var validateWrong = () => handler.ValidateToken(
                    result.Token, ValidationParameters(OtherSecretKey), out _);
                validateWrong.Should().Throw<SecurityTokenException>(
                    "the token must be rejected when validated with a different key");
            });
    }

    // Feature: authentication-login-jwt, Property 2: Vigencia del token dentro de la tolerancia
    //
    // Para cualquier (userId, username) no vacíos, en el token generado la diferencia exp - iat
    // está dentro de [3600 - 1, 3600] segundos, y ExpiresInSeconds es igual a 3600.
    //
    // **Validates: Requirements 1.2, 2.2**
    /// <summary>
    /// For any non-empty (userId, username), exp - iat is within [3599, 3600] seconds and
    /// ExpiresInSeconds equals 3600.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Token_LifetimeIsWithinTolerance()
    {
        return Prop.ForAll(
            NonEmptyValue().ToArbitrary(),
            NonEmptyValue().ToArbitrary(),
            (userId, username) =>
            {
                var service = CreateService();
                var result = service.GenerateToken(userId, username);

                result.ExpiresInSeconds.Should().Be(3600, "the token must be valid for 3600 seconds");

                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(result.Token);

                // The token is issued with notBefore = issuedAt and expires = issuedAt + 60 min,
                // so the "nbf" claim reflects the emission instant (iat). ValidTo/ValidFrom
                // expose these as UTC DateTimes computed from the exp/nbf claims.
                var issuedAt = jwt.ValidFrom;
                var expiresAt = jwt.ValidTo;

                issuedAt.Should().NotBe(default, "the token must carry an emission instant (nbf)");
                expiresAt.Should().NotBe(default, "the token must carry an expiration instant (exp)");

                var delta = (long)Math.Round((expiresAt - issuedAt).TotalSeconds);
                delta.Should().BeInRange(3599, 3600,
                    "exp - iat must be within the 1-second tolerance of 3600 seconds");
            });
    }

    // Feature: authentication-login-jwt, Property 3: Round-trip de claims
    //
    // Para cualquier (userId, username) no vacíos, el token decodificado contiene un claim de
    // identificador de usuario igual a userId y un claim de nombre de usuario igual a username.
    //
    // **Validates: Requirements 2.3**
    /// <summary>
    /// For any non-empty (userId, username), the decoded token contains a userId claim equal
    /// to userId and a username claim equal to username.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Token_ContainsExpectedUserIdAndUsernameClaims()
    {
        return Prop.ForAll(
            NonEmptyValue().ToArbitrary(),
            NonEmptyValue().ToArbitrary(),
            (userId, username) =>
            {
                var service = CreateService();
                var result = service.GenerateToken(userId, username);

                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(result.Token);

                // userId is emitted as the "sub" claim.
                var subClaim = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
                subClaim.Should().NotBeNull("the token must include a userId (sub) claim");
                subClaim!.Value.Should().Be(userId, "the userId claim must equal the provided userId");

                // username is emitted as the "unique_name" claim.
                var uniqueNameClaim = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.UniqueName);
                uniqueNameClaim.Should().NotBeNull("the token must include a username (unique_name) claim");
                uniqueNameClaim!.Value.Should().Be(username, "the username claim must equal the provided username");
            });
    }

    // Feature: authentication-login-jwt, Property 4: Datos de usuario vacíos impiden la emisión
    //
    // Para cualquier entrada donde userId o username sean vacíos o compuestos solo por espacios,
    // JwtTokenService.GenerateToken lanza un error y no devuelve un token.
    //
    // **Validates: Requirements 2.7**
    /// <summary>
    /// For any input where userId or username is empty or whitespace-only, GenerateToken throws
    /// InvalidOperationException and returns no token.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property EmptyOrWhitespaceUserData_ThrowsAndEmitsNoToken()
    {
        // At least one of the two fields is empty/whitespace; the other may be valid or invalid.
        var invalidPairGen =
            Gen.OneOf(
                // Invalid userId, valid username
                EmptyOrWhitespaceValue().SelectMany(u => NonEmptyValue().Select(n => (u, n))),
                // Valid userId, invalid username
                NonEmptyValue().SelectMany(u => EmptyOrWhitespaceValue().Select(n => (u, n))),
                // Both invalid
                EmptyOrWhitespaceValue().SelectMany(u => EmptyOrWhitespaceValue().Select(n => (u, n))));

        return Prop.ForAll(
            invalidPairGen.ToArbitrary(),
            pair =>
            {
                var (userId, username) = pair;
                var service = CreateService();

                var act = () => service.GenerateToken(userId, username);

                act.Should().Throw<InvalidOperationException>(
                    "empty or whitespace-only user data must prevent token issuance");
            });
    }

    // Feature: authentication-login-jwt, Property 4 (example companion for task 4.6)
    //
    // Example test: fallo de firma no emite token.
    // Con una SecretKey inválida para HMAC-SHA256 (demasiado corta para producir una clave
    // válida), GenerateToken lanza sin emitir token.
    //
    // _Requirements: 2.8_
    /// <summary>
    /// With a SecretKey too short to be valid for HMAC-SHA256, GenerateToken throws
    /// InvalidOperationException without emitting a token.
    /// </summary>
    [Fact]
    public void GenerateToken_WithSigningKeyTooShort_ThrowsWithoutEmittingToken()
    {
        // A short key (< 256 bits / 32 bytes) is invalid for HMAC-SHA256 signing.
        var service = CreateService(secretKey: "short");

        var act = () => service.GenerateToken("user-1", "usuario");

        act.Should().Throw<InvalidOperationException>(
            "a signing failure must prevent the token from being emitted");
    }
}

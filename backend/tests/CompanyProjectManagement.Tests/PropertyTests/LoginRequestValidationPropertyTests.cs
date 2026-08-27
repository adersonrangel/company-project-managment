using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.Validators;
using FluentAssertions;
using FluentValidation.Results;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace CompanyProjectManagement.Tests.PropertyTests;

// Feature: authentication-login-jwt, Property 7: Rechazo de entradas de login fuera de límites
//
// Para cualquier LoginRequest con `username` o `password` ausente/vacío o de longitud mayor a 256,
// LoginRequestValidator reporta el fallo (mapea a HTTP 400) e identifica el campo infractor
// (`username` o `password`).
//
// **Validates: Requirements 1.5**
public class LoginRequestValidationPropertyTests
{
    private static readonly LoginRequestValidator Validator = new();

    // Printable visible ASCII chars used to build valid, non-empty field values.
    private static readonly Gen<char> PrintableCharGen =
        Gen.Choose(33, 126).Select(i => (char)i);

    private static Gen<string> ValidField() =>
        Gen.Choose(1, 256)
            .SelectMany(len => Gen.ArrayOf(PrintableCharGen, len))
            .Select(chars => new string(chars));

    /// <summary>
    /// Generates field values that violate the validator's bounds:
    /// absent/empty, whitespace-only, or length greater than 256.
    /// </summary>
    private static Gen<string> InvalidField() =>
        Gen.OneOf(
            Gen.Constant(string.Empty),
            Gen.Constant("   "),
            Gen.Constant("\t\n"),
            Gen.Choose(257, 320)
                .SelectMany(len => Gen.ArrayOf(PrintableCharGen, len))
                .Select(chars => new string(chars)));

    /// <summary>
    /// For any out-of-bounds Username (empty/whitespace or length > 256), the validator
    /// reports the failure and the offending field is identified as "Username".
    /// </summary>
    [Property(MaxTest = 100)]
    public Property InvalidUsername_IsRejected_AndIdentifiesUsername()
    {
        return Prop.ForAll(
            InvalidField().ToArbitrary(),
            ValidField().ToArbitrary(),
            (invalidUsername, validPassword) =>
            {
                var request = new LoginRequest(invalidUsername, validPassword);

                ValidationResult result = Validator.Validate(request);

                result.IsValid.Should().BeFalse();
                result.Errors.Should().Contain(
                    e => e.PropertyName == nameof(LoginRequest.Username),
                    "the offending field must be identified as Username");
                result.Errors.Should().NotContain(
                    e => e.PropertyName == nameof(LoginRequest.Password),
                    "a valid Password must not produce an error");
            });
    }

    /// <summary>
    /// For any out-of-bounds Password (empty/whitespace or length > 256), the validator
    /// reports the failure and the offending field is identified as "Password".
    /// </summary>
    [Property(MaxTest = 100)]
    public Property InvalidPassword_IsRejected_AndIdentifiesPassword()
    {
        return Prop.ForAll(
            ValidField().ToArbitrary(),
            InvalidField().ToArbitrary(),
            (validUsername, invalidPassword) =>
            {
                var request = new LoginRequest(validUsername, invalidPassword);

                ValidationResult result = Validator.Validate(request);

                result.IsValid.Should().BeFalse();
                result.Errors.Should().Contain(
                    e => e.PropertyName == nameof(LoginRequest.Password),
                    "the offending field must be identified as Password");
                result.Errors.Should().NotContain(
                    e => e.PropertyName == nameof(LoginRequest.Username),
                    "a valid Username must not produce an error");
            });
    }

    /// <summary>
    /// When both fields are out of bounds, the validator reports the failure and
    /// identifies both offending fields (Username and Password).
    /// </summary>
    [Property(MaxTest = 100)]
    public Property BothFieldsInvalid_IsRejected_AndIdentifiesBothFields()
    {
        return Prop.ForAll(
            InvalidField().ToArbitrary(),
            InvalidField().ToArbitrary(),
            (invalidUsername, invalidPassword) =>
            {
                var request = new LoginRequest(invalidUsername, invalidPassword);

                ValidationResult result = Validator.Validate(request);

                result.IsValid.Should().BeFalse();
                result.Errors.Should().Contain(e => e.PropertyName == nameof(LoginRequest.Username));
                result.Errors.Should().Contain(e => e.PropertyName == nameof(LoginRequest.Password));
            });
    }
}

using System.Net;
using System.Net.Http.Json;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Tests.Generators;
using CompanyProjectManagement.Tests.Infrastructure;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Property 3: Validación de campos de Empresa rechaza datos inválidos
/// 
/// Para cualquier solicitud de creación de empresa donde al menos un campo viole las reglas
/// de validación, el sistema debe rechazar la operación sin crear registros y retornar 400 Bad Request.
/// 
/// **Validates: Requirements 1.3, 1.4, 3.3, 10.1, 10.2, 10.4, 10.6**
/// </summary>
public class EmpresaValidationPropertyTests
{
    /// <summary>
    /// Un Nombre inválido (vacío, solo espacios, o excede 200 caracteres) debe ser rechazado con 400
    /// y no debe crear ningún registro en el sistema.
    /// **Validates: Requirements 1.3, 1.4, 10.1, 10.6**
    /// </summary>
    [Property(MaxTest = 5)]
    public Property InvalidNombre_IsRejected()
    {
        return Prop.ForAll(
            Arbitraries.InvalidString(200).ToArbitrary(),
            invalidNombre =>
            {
                using var factory = new CustomWebApplicationFactory();
                using var client = factory.CreateClient();

                // Get initial count of empresas
                var initialList = client.GetFromJsonAsync<List<EmpresaListResponse>>("/api/empresas")
                    .GetAwaiter().GetResult();
                var initialCount = initialList?.Count ?? 0;

                var request = new CrearEmpresaRequest(
                    invalidNombre, "VALID-ID-123", "+1234567", "Valid Address 123", true);

                var response = client.PostAsJsonAsync("/api/empresas", request).GetAwaiter().GetResult();
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

                // Verify no records were created
                var afterList = client.GetFromJsonAsync<List<EmpresaListResponse>>("/api/empresas")
                    .GetAwaiter().GetResult();
                var afterCount = afterList?.Count ?? 0;
                afterCount.Should().Be(initialCount, "no records should be created when validation fails");
            });
    }

    /// <summary>
    /// Una Identificacion inválida (vacía, solo espacios, o excede 50 caracteres) debe ser rechazada con 400
    /// y no debe crear ningún registro en el sistema.
    /// **Validates: Requirements 1.3, 1.4, 10.2, 10.6**
    /// </summary>
    [Property(MaxTest = 5)]
    public Property InvalidIdentificacion_IsRejected()
    {
        return Prop.ForAll(
            Arbitraries.InvalidString(50).ToArbitrary(),
            invalidIdentificacion =>
            {
                using var factory = new CustomWebApplicationFactory();
                using var client = factory.CreateClient();

                // Get initial count of empresas
                var initialList = client.GetFromJsonAsync<List<EmpresaListResponse>>("/api/empresas")
                    .GetAwaiter().GetResult();
                var initialCount = initialList?.Count ?? 0;

                var request = new CrearEmpresaRequest(
                    "Empresa Válida", invalidIdentificacion, "+1234567", "Valid Address 123", true);

                var response = client.PostAsJsonAsync("/api/empresas", request).GetAwaiter().GetResult();
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

                // Verify no records were created
                var afterList = client.GetFromJsonAsync<List<EmpresaListResponse>>("/api/empresas")
                    .GetAwaiter().GetResult();
                var afterCount = afterList?.Count ?? 0;
                afterCount.Should().Be(initialCount, "no records should be created when validation fails");
            });
    }

    /// <summary>
    /// Una Direccion inválida (vacía, solo espacios, o excede 300 caracteres) debe ser rechazada con 400
    /// y no debe crear ningún registro en el sistema.
    /// **Validates: Requirements 1.3, 1.4, 10.4, 10.6**
    /// </summary>
    [Property(MaxTest = 5)]
    public Property InvalidDireccion_IsRejected()
    {
        return Prop.ForAll(
            Arbitraries.InvalidString(300).ToArbitrary(),
            invalidDireccion =>
            {
                using var factory = new CustomWebApplicationFactory();
                using var client = factory.CreateClient();

                // Get initial count of empresas
                var initialList = client.GetFromJsonAsync<List<EmpresaListResponse>>("/api/empresas")
                    .GetAwaiter().GetResult();
                var initialCount = initialList?.Count ?? 0;

                var request = new CrearEmpresaRequest(
                    "Empresa Válida", "VALID-ID-456", "+1234567", invalidDireccion, true);

                var response = client.PostAsJsonAsync("/api/empresas", request).GetAwaiter().GetResult();
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

                // Verify no records were created
                var afterList = client.GetFromJsonAsync<List<EmpresaListResponse>>("/api/empresas")
                    .GetAwaiter().GetResult();
                var afterCount = afterList?.Count ?? 0;
                afterCount.Should().Be(initialCount, "no records should be created when validation fails");
            });
    }

    /// <summary>
    /// Para cualquier solicitud de creación de empresa con al menos un campo inválido,
    /// el sistema debe rechazar la operación (400 Bad Request) sin crear ni modificar registros.
    /// Genera combinaciones donde al menos uno de los campos obligatorios viola las reglas de validación.
    /// **Validates: Requirements 1.3, 1.4, 3.3, 10.1, 10.2, 10.4, 10.6**
    /// </summary>
    [Property(MaxTest = 5)]
    public Property InvalidRequest_WithAtLeastOneInvalidField_IsRejectedWithoutCreatingRecords()
    {
        var invalidRequestArb = InvalidCrearEmpresaRequestWithAtLeastOneInvalidField();

        return Prop.ForAll(invalidRequestArb, request =>
        {
            using var factory = new CustomWebApplicationFactory();
            using var client = factory.CreateClient();

            // Get initial count of empresas
            var initialList = client.GetFromJsonAsync<List<EmpresaListResponse>>("/api/empresas")
                .GetAwaiter().GetResult();
            var initialCount = initialList?.Count ?? 0;

            // POST the invalid request
            var response = client.PostAsJsonAsync("/api/empresas", request).GetAwaiter().GetResult();
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
                $"Request should be rejected. Nombre.Length={request.Nombre?.Length}, " +
                $"Identificacion.Length={request.Identificacion?.Length}, " +
                $"Telefono='{request.Telefono}', " +
                $"Direccion.Length={request.Direccion?.Length}");

            // Verify no records were created
            var afterList = client.GetFromJsonAsync<List<EmpresaListResponse>>("/api/empresas")
                .GetAwaiter().GetResult();
            var afterCount = afterList?.Count ?? 0;
            afterCount.Should().Be(initialCount,
                "no records should be created when at least one field is invalid");
        });
    }

    /// <summary>
    /// Generates CrearEmpresaRequest instances where at least one field is invalid.
    /// Uses a strategy that randomly selects which fields to invalidate (at least one).
    /// </summary>
    private static Arbitrary<CrearEmpresaRequest> InvalidCrearEmpresaRequestWithAtLeastOneInvalidField()
    {
        // Valid field generators
        var validNombre = Gen.Choose(1, 200)
            .SelectMany(len => Gen.ArrayOf(Gen.Choose(33, 126).Select(i => (char)i), len))
            .Select(chars => new string(chars));

        var validIdentificacion = Gen.Choose(1, 50)
            .SelectMany(len => Gen.ArrayOf(Gen.Choose(33, 126).Select(i => (char)i), len))
            .Select(chars => new string(chars));

        var validTelefono = Gen.Choose(1, 20)
            .SelectMany(len => Gen.ArrayOf(
                Gen.OneOf(
                    Gen.Choose('0', '9').Select(i => (char)i),
                    Gen.Constant('+'),
                    Gen.Constant('-')
                ), len))
            .Select(chars => new string(chars))
            .Where(t => t.Trim().Length > 0);

        var validDireccion = Gen.Choose(1, 300)
            .SelectMany(len => Gen.ArrayOf(Gen.Choose(33, 126).Select(i => (char)i), len))
            .Select(chars => new string(chars));

        // Invalid field generators
        var invalidNombre = Arbitraries.InvalidString(200);
        var invalidIdentificacion = Arbitraries.InvalidString(50);
        var invalidTelefono = Arbitraries.InvalidPhone();
        var invalidDireccion = Arbitraries.InvalidString(300);

        // Generate a bitmask (1-15) where each bit indicates if a field should be invalid.
        // At least one bit must be set (value >= 1).
        var gen = from mask in Gen.Choose(1, 15) // 4 bits, at least one set
                  from nombre in (mask & 1) != 0 ? invalidNombre : validNombre
                  from identificacion in (mask & 2) != 0 ? invalidIdentificacion : validIdentificacion
                  from telefono in (mask & 4) != 0 ? invalidTelefono : validTelefono
                  from direccion in (mask & 8) != 0 ? invalidDireccion : validDireccion
                  from estado in Gen.OneOf(Gen.Constant<bool?>(true), Gen.Constant<bool?>(false), Gen.Constant<bool?>(null))
                  select new CrearEmpresaRequest(nombre, identificacion, telefono, direccion, estado);

        return gen.ToArbitrary();
    }
}

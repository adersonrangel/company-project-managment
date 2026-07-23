using FsCheck;
using FsCheck.Fluent;
using CompanyProjectManagement.Application.DTOs.Requests;

namespace CompanyProjectManagement.Tests.Generators;

public static class Arbitraries
{
    // Helper to generate random strings of given length range with specified charset
    private static Gen<string> GenString(int minLen, int maxLen, Gen<char> charGen) =>
        Gen.Choose(minLen, maxLen)
            .SelectMany(len => Gen.ArrayOf(charGen, len))
            .Select(chars => new string(chars));

    // Valid phone chars: digits, +, space, hyphen
    private static readonly Gen<char> PhoneCharGen =
        Gen.OneOf(
            Gen.Choose('0', '9').Select(i => (char)i),
            Gen.Constant('+'),
            Gen.Constant(' '),
            Gen.Constant('-')
        );

    // Printable chars for general text fields
    private static readonly Gen<char> PrintableCharGen =
        Gen.Choose(33, 126).Select(i => (char)i); // Visible ASCII chars

    /// <summary>
    /// Generates valid CrearEmpresaRequest instances respecting all validation rules:
    /// - Nombre: 1-200 chars, at least one visible char
    /// - Identificacion: 1-50 chars, at least one visible char
    /// - Telefono: 1-20 chars, only digits/+/spaces/hyphens, at least one visible char
    /// - Direccion: 1-300 chars, at least one visible char
    /// - EstadoHabilitacion: true, false, or null
    /// </summary>
    public static Arbitrary<CrearEmpresaRequest> ValidCrearEmpresaRequest() =>
        (from nombre in GenString(1, 200, PrintableCharGen)
         from identificacion in GenString(1, 50, PrintableCharGen)
         from telefono in GenString(1, 20, PhoneCharGen).Where(t => t.Trim().Length > 0)
         from direccion in GenString(1, 300, PrintableCharGen)
         from estado in Gen.OneOf(Gen.Constant<bool?>(true), Gen.Constant<bool?>(false), Gen.Constant<bool?>(null))
         select new CrearEmpresaRequest(nombre, identificacion, telefono, direccion, estado))
        .ToArbitrary();

    /// <summary>
    /// Generates valid CrearProyectoRequest instances respecting all validation rules:
    /// - Nombre: 1-200 chars, at least one non-whitespace char
    /// - FechaHabilitacion: ISO 8601 "yyyy-MM-dd", range 2000-01-01 to 2099-12-31
    /// - EstadoHabilitacion: true, false, or null
    /// </summary>
    public static Arbitrary<CrearProyectoRequest> ValidCrearProyectoRequest() =>
        (from nombre in GenString(1, 200, PrintableCharGen)
         from year in Gen.Choose(2000, 2099)
         from month in Gen.Choose(1, 12)
         from day in Gen.Choose(1, 28) // Safe day range for all months
         from estado in Gen.OneOf(Gen.Constant<bool?>(true), Gen.Constant<bool?>(false), Gen.Constant<bool?>(null))
         let fecha = $"{year:D4}-{month:D2}-{day:D2}"
         select new CrearProyectoRequest(nombre, fecha, estado))
        .ToArbitrary();

    /// <summary>
    /// Generates invalid strings: empty, whitespace-only, or exceeding maxLength.
    /// Used for testing validation rejection of invalid field values.
    /// </summary>
    public static Gen<string> InvalidString(int maxLength) =>
        Gen.OneOf(
            Gen.Constant(""),
            Gen.Constant("   "),
            Gen.Constant("\t\n"),
            GenString(maxLength + 1, maxLength + 50, PrintableCharGen)
        );

    /// <summary>
    /// Generates phone strings with at least one invalid character.
    /// Valid phone chars are: digits (0-9), +, space, hyphen.
    /// This generator produces strings containing letters or special symbols.
    /// </summary>
    public static Gen<string> InvalidPhone() =>
        Gen.OneOf(
            Gen.Constant("abc123"),
            Gen.Constant("12@34"),
            Gen.Constant("123#456"),
            Gen.Constant("phone!"),
            GenString(1, 20, Gen.Choose('a', 'z').Select(i => (char)i))
        );
}

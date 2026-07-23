using CompanyProjectManagement.Application.DTOs.Requests;
using FluentValidation;

namespace CompanyProjectManagement.Application.Validators;

public class CrearProyectoValidator : AbstractValidator<CrearProyectoRequest>
{
    private static readonly DateOnly MinDate = new(2000, 1, 1);
    private static readonly DateOnly MaxDate = new(2099, 12, 31);

    public CrearProyectoValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo Nombre es obligatorio.")
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("El campo Nombre debe contener al menos un carácter que no sea espacio en blanco.")
            .MaximumLength(200).WithMessage("El campo Nombre no debe exceder los 200 caracteres.");

        RuleFor(x => x.FechaHabilitacion)
            .NotEmpty().WithMessage("El campo FechaHabilitación es obligatorio.")
            .Must(BeValidIso8601Date)
            .WithMessage("El campo FechaHabilitación debe ser una fecha válida en formato ISO 8601 (yyyy-MM-dd).")
            .Must(BeInValidDateRange)
            .WithMessage("El campo FechaHabilitación debe estar entre 2000-01-01 y 2099-12-31.");
    }

    private static bool BeValidIso8601Date(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return DateOnly.TryParseExact(value, "yyyy-MM-dd", out _);
    }

    private static bool BeInValidDateRange(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", out var date))
            return false;

        return date >= MinDate && date <= MaxDate;
    }
}

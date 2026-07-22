using CompanyProjectManagement.Application.DTOs.Requests;
using FluentValidation;

namespace CompanyProjectManagement.Application.Validators;

public class CrearEmpresaValidator : AbstractValidator<CrearEmpresaRequest>
{
    public CrearEmpresaValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo Nombre es obligatorio.")
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("El campo Nombre debe contener al menos un carácter visible.")
            .MaximumLength(200).WithMessage("El campo Nombre no debe exceder los 200 caracteres.");

        RuleFor(x => x.Identificacion)
            .NotEmpty().WithMessage("El campo Identificación es obligatorio.")
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("El campo Identificación debe contener al menos un carácter visible.")
            .MaximumLength(50).WithMessage("El campo Identificación no debe exceder los 50 caracteres.");

        RuleFor(x => x.Telefono)
            .NotEmpty().WithMessage("El campo Teléfono es obligatorio.")
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("El campo Teléfono debe contener al menos un carácter visible.")
            .MaximumLength(20).WithMessage("El campo Teléfono no debe exceder los 20 caracteres.")
            .Matches(@"^[\d\s\+\-]+$").WithMessage("El campo Teléfono solo puede contener dígitos, +, espacios o guiones.");

        RuleFor(x => x.Direccion)
            .NotEmpty().WithMessage("El campo Dirección es obligatorio.")
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("El campo Dirección debe contener al menos un carácter visible.")
            .MaximumLength(300).WithMessage("El campo Dirección no debe exceder los 300 caracteres.");
    }
}

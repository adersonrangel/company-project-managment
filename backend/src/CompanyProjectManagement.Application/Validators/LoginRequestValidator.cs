using CompanyProjectManagement.Application.DTOs.Requests;
using FluentValidation;

namespace CompanyProjectManagement.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("El campo Usuario es obligatorio.")
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("El campo Usuario debe contener al menos un carácter visible.")
            .MaximumLength(256).WithMessage("El campo Usuario no debe exceder los 256 caracteres.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("El campo Contraseña es obligatorio.")
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("El campo Contraseña debe contener al menos un carácter visible.")
            .MaximumLength(256).WithMessage("El campo Contraseña no debe exceder los 256 caracteres.");
    }
}

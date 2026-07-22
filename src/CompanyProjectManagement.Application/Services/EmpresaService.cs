using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Domain.Exceptions;
using CompanyProjectManagement.Domain.Repositories;
using FluentValidation;

namespace CompanyProjectManagement.Application.Services;

public class EmpresaService : IEmpresaService
{
    private readonly IEmpresaRepository _empresaRepository;
    private readonly IValidator<CrearEmpresaRequest> _crearValidator;
    private readonly IValidator<ActualizarEmpresaRequest> _actualizarValidator;

    public EmpresaService(
        IEmpresaRepository empresaRepository,
        IValidator<CrearEmpresaRequest> crearValidator,
        IValidator<ActualizarEmpresaRequest> actualizarValidator)
    {
        _empresaRepository = empresaRepository;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    public async Task<EmpresaResponse> CrearAsync(CrearEmpresaRequest request)
    {
        var validationResult = await _crearValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        if (await _empresaRepository.ExisteIdentificacionAsync(request.Identificacion))
        {
            throw new DuplicateIdentificationException("Empresa", "Identificacion", request.Identificacion);
        }

        var empresa = new Empresa
        {
            Nombre = request.Nombre,
            Identificacion = request.Identificacion,
            Telefono = request.Telefono,
            Direccion = request.Direccion,
            EstadoHabilitacion = request.EstadoHabilitacion ?? true
        };

        var creada = await _empresaRepository.CrearAsync(empresa);

        return new EmpresaResponse(
            creada.Id,
            creada.Nombre,
            creada.Identificacion,
            creada.Telefono,
            creada.Direccion,
            creada.EstadoHabilitacion);
    }

    public async Task<IEnumerable<EmpresaListResponse>> ListarAsync()
    {
        var empresas = await _empresaRepository.ListarAsync();

        return empresas.Select(e => new EmpresaListResponse(
            e.Id,
            e.Nombre,
            e.Identificacion,
            e.Telefono,
            e.Direccion,
            e.EstadoHabilitacion));
    }

    public async Task<EmpresaDetalleResponse> ObtenerPorIdAsync(int id)
    {
        var empresa = await _empresaRepository.ObtenerPorIdAsync(id);
        if (empresa is null)
        {
            throw new EntityNotFoundException("Empresa", id);
        }

        var proyectos = empresa.Proyectos.Select(p => new ProyectoListResponse(
            p.Id,
            p.Nombre,
            p.FechaHabilitacion.ToString("yyyy-MM-dd"),
            p.EstadoHabilitacion));

        return new EmpresaDetalleResponse(
            empresa.Id,
            empresa.Nombre,
            empresa.Identificacion,
            empresa.Telefono,
            empresa.Direccion,
            empresa.EstadoHabilitacion,
            proyectos);
    }

    public async Task<EmpresaResponse> ActualizarAsync(int id, ActualizarEmpresaRequest request)
    {
        var validationResult = await _actualizarValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var empresa = await _empresaRepository.ObtenerPorIdAsync(id);
        if (empresa is null)
        {
            throw new EntityNotFoundException("Empresa", id);
        }

        if (await _empresaRepository.ExisteIdentificacionAsync(request.Identificacion, excluirId: id))
        {
            throw new DuplicateIdentificationException("Empresa", "Identificacion", request.Identificacion);
        }

        empresa.Nombre = request.Nombre;
        empresa.Identificacion = request.Identificacion;
        empresa.Telefono = request.Telefono;
        empresa.Direccion = request.Direccion;
        empresa.EstadoHabilitacion = request.EstadoHabilitacion;

        var actualizada = await _empresaRepository.ActualizarAsync(empresa);

        return new EmpresaResponse(
            actualizada.Id,
            actualizada.Nombre,
            actualizada.Identificacion,
            actualizada.Telefono,
            actualizada.Direccion,
            actualizada.EstadoHabilitacion);
    }

    public async Task EliminarAsync(int id)
    {
        var empresa = await _empresaRepository.ObtenerPorIdAsync(id);
        if (empresa is null)
        {
            throw new EntityNotFoundException("Empresa", id);
        }

        if (await _empresaRepository.TieneProyectosAsync(id))
        {
            throw new ReferentialIntegrityException("Empresa", "Proyecto");
        }

        await _empresaRepository.EliminarAsync(empresa);
    }
}

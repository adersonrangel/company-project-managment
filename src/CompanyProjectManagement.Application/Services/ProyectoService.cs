using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Domain.Exceptions;
using CompanyProjectManagement.Domain.Repositories;
using FluentValidation;

namespace CompanyProjectManagement.Application.Services;

public class ProyectoService : IProyectoService
{
    private readonly IProyectoRepository _proyectoRepository;
    private readonly IEmpresaRepository _empresaRepository;
    private readonly IValidator<CrearProyectoRequest> _crearValidator;
    private readonly IValidator<ActualizarProyectoRequest> _actualizarValidator;

    public ProyectoService(
        IProyectoRepository proyectoRepository,
        IEmpresaRepository empresaRepository,
        IValidator<CrearProyectoRequest> crearValidator,
        IValidator<ActualizarProyectoRequest> actualizarValidator)
    {
        _proyectoRepository = proyectoRepository;
        _empresaRepository = empresaRepository;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    public async Task<ProyectoResponse> CrearAsync(int empresaId, CrearProyectoRequest request)
    {
        var validationResult = await _crearValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var empresa = await _empresaRepository.ObtenerPorIdAsync(empresaId)
            ?? throw new EntityNotFoundException("Empresa", empresaId);

        var existeNombre = await _proyectoRepository.ExisteNombreEnEmpresaAsync(request.Nombre, empresaId);
        if (existeNombre)
            throw new DuplicateIdentificationException("Proyecto", "Nombre", request.Nombre);

        var proyecto = new Proyecto
        {
            Nombre = request.Nombre,
            FechaHabilitacion = DateOnly.ParseExact(request.FechaHabilitacion, "yyyy-MM-dd"),
            EstadoHabilitacion = request.EstadoHabilitacion ?? true,
            EmpresaId = empresaId
        };

        var creado = await _proyectoRepository.CrearAsync(proyecto);

        return new ProyectoResponse(
            creado.Id,
            creado.Nombre,
            creado.FechaHabilitacion.ToString("yyyy-MM-dd"),
            creado.EstadoHabilitacion,
            creado.EmpresaId
        );
    }

    public async Task<IEnumerable<ProyectoListResponse>> ListarPorEmpresaAsync(int empresaId)
    {
        _ = await _empresaRepository.ObtenerPorIdAsync(empresaId)
            ?? throw new EntityNotFoundException("Empresa", empresaId);

        var proyectos = await _proyectoRepository.ListarPorEmpresaAsync(empresaId);

        return proyectos.Select(p => new ProyectoListResponse(
            p.Id,
            p.Nombre,
            p.FechaHabilitacion.ToString("yyyy-MM-dd"),
            p.EstadoHabilitacion
        ));
    }

    public async Task<ProyectoDetalleResponse> ObtenerPorIdAsync(int empresaId, int proyectoId)
    {
        var empresa = await _empresaRepository.ObtenerPorIdAsync(empresaId)
            ?? throw new EntityNotFoundException("Empresa", empresaId);

        var proyecto = await _proyectoRepository.ObtenerPorIdAsync(empresaId, proyectoId)
            ?? throw new EntityNotFoundException("Proyecto", proyectoId);

        return new ProyectoDetalleResponse(
            proyecto.Id,
            proyecto.Nombre,
            proyecto.FechaHabilitacion.ToString("yyyy-MM-dd"),
            proyecto.EstadoHabilitacion,
            proyecto.EmpresaId,
            empresa.Nombre
        );
    }

    public async Task<ProyectoResponse> ActualizarAsync(int empresaId, int proyectoId, ActualizarProyectoRequest request)
    {
        var validationResult = await _actualizarValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        _ = await _empresaRepository.ObtenerPorIdAsync(empresaId)
            ?? throw new EntityNotFoundException("Empresa", empresaId);

        var proyecto = await _proyectoRepository.ObtenerPorIdAsync(empresaId, proyectoId)
            ?? throw new EntityNotFoundException("Proyecto", proyectoId);

        if (request.Nombre is not null && request.Nombre != proyecto.Nombre)
        {
            var existeNombre = await _proyectoRepository.ExisteNombreEnEmpresaAsync(request.Nombre, empresaId, excluirId: proyectoId);
            if (existeNombre)
                throw new DuplicateIdentificationException("Proyecto", "Nombre", request.Nombre);
        }

        if (request.Nombre is not null)
            proyecto.Nombre = request.Nombre;

        if (request.FechaHabilitacion is not null)
            proyecto.FechaHabilitacion = DateOnly.ParseExact(request.FechaHabilitacion, "yyyy-MM-dd");

        if (request.EstadoHabilitacion is not null)
            proyecto.EstadoHabilitacion = request.EstadoHabilitacion.Value;

        var actualizado = await _proyectoRepository.ActualizarAsync(proyecto);

        return new ProyectoResponse(
            actualizado.Id,
            actualizado.Nombre,
            actualizado.FechaHabilitacion.ToString("yyyy-MM-dd"),
            actualizado.EstadoHabilitacion,
            actualizado.EmpresaId
        );
    }

    public async Task EliminarAsync(int empresaId, int proyectoId)
    {
        _ = await _empresaRepository.ObtenerPorIdAsync(empresaId)
            ?? throw new EntityNotFoundException("Empresa", empresaId);

        var proyecto = await _proyectoRepository.ObtenerPorIdAsync(empresaId, proyectoId)
            ?? throw new EntityNotFoundException("Proyecto", proyectoId);

        await _proyectoRepository.EliminarAsync(proyecto);
    }
}

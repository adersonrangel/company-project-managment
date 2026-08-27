namespace CompanyProjectManagement.Api.Controllers;

using CompanyProjectManagement.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("estadisticas")]
    public async Task<IActionResult> ObtenerEstadisticas()
    {
        var estadisticas = await _dashboardService.ObtenerEstadisticasAsync();
        return Ok(estadisticas);
    }
}

namespace CompanyProjectManagement.Domain.Entities;

public class Proyecto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateOnly FechaHabilitacion { get; set; }
    public bool EstadoHabilitacion { get; set; } = true;
    public int EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
}

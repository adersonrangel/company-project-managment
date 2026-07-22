namespace CompanyProjectManagement.Domain.Entities;

public class Empresa
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Identificacion { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public bool EstadoHabilitacion { get; set; } = true;
    public ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();
}

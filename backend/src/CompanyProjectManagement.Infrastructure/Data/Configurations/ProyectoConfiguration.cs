using CompanyProjectManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CompanyProjectManagement.Infrastructure.Data.Configurations;

public class ProyectoConfiguration : IEntityTypeConfiguration<Proyecto>
{
    public void Configure(EntityTypeBuilder<Proyecto> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Nombre).IsRequired().HasMaxLength(200);
        builder.HasIndex(p => new { p.EmpresaId, p.Nombre }).IsUnique();
        builder.Property(p => p.FechaHabilitacion).IsRequired();
        builder.Property(p => p.EstadoHabilitacion).HasDefaultValue(true);
    }
}

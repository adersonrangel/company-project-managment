using CompanyProjectManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CompanyProjectManagement.Infrastructure.Data.Configurations;

public class EmpresaConfiguration : IEntityTypeConfiguration<Empresa>
{
    public void Configure(EntityTypeBuilder<Empresa> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Identificacion).IsRequired().HasMaxLength(50);
        builder.HasIndex(e => e.Identificacion).IsUnique();
        builder.Property(e => e.Telefono).IsRequired().HasMaxLength(20);
        builder.Property(e => e.Direccion).IsRequired().HasMaxLength(300);
        builder.Property(e => e.EstadoHabilitacion).HasDefaultValue(true);
        builder.HasMany(e => e.Proyectos)
               .WithOne(p => p.Empresa)
               .HasForeignKey(p => p.EmpresaId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

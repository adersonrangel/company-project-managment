using CompanyProjectManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CompanyProjectManagement.Infrastructure.Data.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Username).IsRequired().HasMaxLength(64);
        builder.HasIndex(u => u.Username).IsUnique();
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.PasswordSalt).IsRequired();

        // Seed del usuario administrador inicial (Req 4.1, 4.2).
        // El hash y la sal son valores deterministas generados con PasswordHasher
        // (PBKDF2/SHA-256, 100_000 iteraciones) para la contraseña "Admin123!".
        // La contraseña en texto plano nunca se persiste; solo el hash y la sal.
        // Estos mismos valores se reutilizan en la migración de PostgreSQL.
        builder.HasData(new Usuario
        {
            Id = 1,
            Username = "admin",
            PasswordHash = "AONYG/t/ztweZl2M0DUbwEUpBcfeFWBmukI4PpIvpPU=",
            PasswordSalt = "QWRtaW5TZWVkU2FsdDAxIQ=="
        });
    }
}

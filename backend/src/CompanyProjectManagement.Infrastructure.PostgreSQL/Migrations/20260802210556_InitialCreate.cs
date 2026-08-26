using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CompanyProjectManagement.Infrastructure.Migrations.PostgreSQL
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "empresas",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    identificacion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    direccion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    estado_habilitacion = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_empresas", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "proyectos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    fecha_habilitacion = table.Column<DateOnly>(type: "date", nullable: false),
                    estado_habilitacion = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    empresa_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_proyectos", x => x.id);
                    table.ForeignKey(
                        name: "fk_proyectos_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_empresas_identificacion",
                table: "empresas",
                column: "identificacion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_proyectos_empresa_id_nombre",
                table: "proyectos",
                columns: new[] { "empresa_id", "nombre" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "proyectos");

            migrationBuilder.DropTable(
                name: "empresas");
        }
    }
}

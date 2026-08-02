# Implementation Plan: PostgreSQL Support

## Overview

Agregar soporte de PostgreSQL como proveedor alternativo de base de datos al proyecto CompanyProjectManagement, manteniendo compatibilidad con SQL Server. La implementación se basa en selección por configuración, repositorios compartidos, migraciones separadas y validación de conectividad al inicio.

## Tasks

- [x] 1. Add NuGet package and update configuration files
  - [x] 1.1 Add Npgsql.EntityFrameworkCore.PostgreSQL package reference to Infrastructure project
    - Add `<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.10" />` to `CompanyProjectManagement.Infrastructure.csproj`
    - Ensure version 10.x matches existing Microsoft.EntityFrameworkCore packages
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.2 Update appsettings.json with DatabaseProvider key and provider-keyed connection strings
    - Add `"DatabaseProvider": "SqlServer"` at root level
    - Rename `"DefaultConnection"` to `"SqlServer"` in ConnectionStrings section
    - Add `"PostgreSQL"` connection string entry in ConnectionStrings section
    - Apply same changes to `appsettings.Development.json`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Implement DatabaseServiceExtensions for provider selection
  - [x] 2.1 Create DatabaseServiceExtensions static class
    - Create file `Infrastructure/Extensions/DatabaseServiceExtensions.cs`
    - Implement `AddDatabaseProvider(this IServiceCollection services, IConfiguration configuration)` extension method
    - Read `DatabaseProvider` from configuration, default to "SqlServer" if missing/null
    - Validate provider is in `["SqlServer", "PostgreSQL"]`; throw `InvalidOperationException` with invalid value and valid list if not
    - Read connection string using provider name as key; throw `InvalidOperationException` if missing/empty
    - Register `ApplicationDbContext` with `UseNpgsql` for PostgreSQL or `UseSqlServer` for SqlServer
    - Set `MigrationsAssembly` for both providers
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 2.4_

  - [x] 2.2 Write property test for provider selection determinism (Property 1)
    - **Property 1: Provider selection determinism**
    - For any valid provider name in {"SqlServer", "PostgreSQL"} with a matching non-empty connection string, `AddDatabaseProvider` configures the DbContext with the correct EF Core provider
    - Use `Gen.Elements("SqlServer", "PostgreSQL")` to generate valid providers
    - **Validates: Requirements 1.1, 1.2, 2.3**

  - [x] 2.3 Write property test for invalid provider rejection (Property 2)
    - **Property 2: Invalid provider rejection with descriptive message**
    - For any string that is not "SqlServer" or "PostgreSQL", `AddDatabaseProvider` throws `InvalidOperationException` containing the invalid value and valid providers list
    - Use `Arb.Default.String()` filtered by `!= "SqlServer" && != "PostgreSQL"`
    - **Validates: Requirements 1.3**

  - [x] 2.4 Write property test for missing connection string rejection (Property 3)
    - **Property 3: Missing connection string rejection with descriptive message**
    - For any valid provider name with no matching connection string entry (or null/whitespace value), throws `InvalidOperationException` with provider name in message
    - Use `Gen.Elements("SqlServer", "PostgreSQL")` with empty configuration
    - **Validates: Requirements 1.4**

- [x] 3. Update Program.cs to use DatabaseServiceExtensions
  - [x] 3.1 Replace hardcoded DbContext registration with AddDatabaseProvider call
    - Remove existing `builder.Services.AddDbContext<ApplicationDbContext>(...)` block
    - Replace with `builder.Services.AddDatabaseProvider(builder.Configuration);`
    - Add required `using` for the new Extensions namespace
    - _Requirements: 1.1, 1.2, 2.3_

- [x] 4. Checkpoint - Verify build and provider registration
  - Ensure `dotnet build` completes without errors for the entire solution. Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement DesignTimeDbContextFactory with provider argument support
  - [x] 5.1 Update DesignTimeDbContextFactory to accept --provider argument
    - Modify `Infrastructure/Data/DesignTimeDbContextFactory.cs`
    - Implement `ResolveProvider(string[] args)` to parse `--provider=X` from CLI arguments
    - Default to "SqlServer" when argument is missing or invalid
    - Configure `UseNpgsql` when provider is "PostgreSQL", `UseSqlServer` when "SqlServer"
    - Set `MigrationsAssembly` for both providers
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 5.2 Write property test for DesignTimeDbContextFactory provider resolution (Property 4)
    - **Property 4: DesignTimeDbContextFactory provider argument resolution**
    - For any string array containing `--provider=X` where X is valid, factory creates context for provider X. For arrays without valid `--provider=`, defaults to SqlServer
    - Use arbitrary string arrays with and without `--provider=` entries
    - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 6. Set up separate migration directories per provider
  - [ ] 6.1 Reorganize existing migrations into SqlServer subdirectory
    - Move existing migration files from `Migrations/` to `Migrations/SqlServer/`
    - Update namespace references in migration files to reflect new directory
    - Configure `MigrationsHistoryTable` or output directory settings per provider in the factory
    - _Requirements: 4.1_

- [x] 7. Implement DatabaseHealthCheck for connectivity validation
  - [x] 7.1 Create DatabaseHealthCheck static class
    - Create file `Infrastructure/HealthChecks/DatabaseHealthCheck.cs`
    - Implement `ValidateConnectivityAsync(IServiceProvider services, IConfiguration configuration, ILogger logger)` static method
    - Read provider name from configuration (default "SqlServer")
    - Create a DI scope, resolve `ApplicationDbContext`, call `CanConnectAsync` with 5-second CancellationToken timeout
    - Log Information on success with provider name
    - Log Warning on failure/timeout with provider name and error message
    - Handle `OperationCanceledException`, `TaskCanceledException`, and general exceptions gracefully
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.2 Wire DatabaseHealthCheck into Program.cs startup
    - Add `await DatabaseHealthCheck.ValidateConnectivityAsync(app.Services, app.Configuration, app.Logger);` after `app.Build()` and before `app.Run()`
    - Add required `using` statement
    - _Requirements: 7.1_

  - [x] 7.3 Write property test for health check log messages (Property 5)
    - **Property 5: Connectivity log messages contain provider name**
    - For any provider name and any connection outcome (success, failure, timeout), the log message emitted by the health check contains the configured provider name
    - Use `Arb.Default.String()` for provider name + `Gen.Elements(true, false)` for connection result
    - **Validates: Requirements 7.2, 7.4**

- [x] 8. Checkpoint - Full build and test validation
  - Ensure `dotnet build` and `dotnet test` complete without errors. Ensure all tests pass, ask the user if questions arise.

- [x] 9. Integration wiring and final validation
  - [x] 9.1 Write unit tests for DatabaseServiceExtensions
    - Test default to SqlServer when `DatabaseProvider` is null/missing
    - Test PostgreSQL provider registration with valid configuration
    - Test SqlServer provider registration with valid configuration
    - _Requirements: 1.1, 1.2, 2.4_

  - [x] 9.2 Write unit tests for DatabaseHealthCheck
    - Test logging Information on successful connection
    - Test logging Warning on failed connection
    - Test logging Warning on timeout
    - Test application continues startup after failure
    - Use NSubstitute to mock `ApplicationDbContext` and `ILogger`
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 9.3 Write unit tests for DesignTimeDbContextFactory
    - Test explicit `--provider=SqlServer` argument
    - Test explicit `--provider=PostgreSQL` argument
    - Test default behavior without `--provider` argument
    - Test invalid provider argument defaults to SqlServer
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 10. Final checkpoint - All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using FsCheck.Xunit (v3.3.3, already in the test project)
- Unit tests validate specific examples and edge cases using xUnit + FluentAssertions + NSubstitute (already configured)
- The project uses .NET 10, C#, and Entity Framework Core throughout
- Existing entity configurations (EmpresaConfiguration, ProyectoConfiguration) use provider-agnostic APIs and require no modification (Requirement 3, 5)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1", "5.2"] },
    { "id": 3, "tasks": ["6.1", "7.1"] },
    { "id": 4, "tasks": ["7.2", "7.3"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3"] }
  ]
}
```

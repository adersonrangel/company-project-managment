# Requirements Document

## Introduction

Este documento define los requisitos para agregar soporte de PostgreSQL como motor de base de datos alternativo al existente SQL Server en el proyecto CompanyProjectManagement. La arquitectura actual utiliza Entity Framework Core con el patrón repositorio, donde las interfaces están definidas en la capa Domain y las implementaciones en la capa Infrastructure. El objetivo es permitir intercambiar el motor de base de datos mediante configuración en el contenedor de inyección de dependencias, sin afectar las capas de Domain ni Application.

## Glossary

- **Sistema**: La aplicación backend CompanyProjectManagement.Api y sus capas asociadas (Domain, Application, Infrastructure)
- **Proveedor_De_Base_De_Datos**: Componente de infraestructura que implementa el acceso a datos para un motor específico (SQL Server o PostgreSQL)
- **Contenedor_DI**: El contenedor de inyección de dependencias de ASP.NET Core configurado en Program.cs
- **ApplicationDbContext**: Clase DbContext de Entity Framework Core que gestiona la conexión y mapeo a la base de datos
- **Repositorio**: Clase que implementa una interfaz de la capa Domain para operaciones de acceso a datos
- **Configuración_De_Aplicación**: Archivos appsettings.json y appsettings.{Environment}.json que contienen la configuración del sistema
- **Migración**: Conjunto de cambios de esquema generados por Entity Framework Core para aplicar a la base de datos

## Requirements

### Requirement 1: Registro del proveedor PostgreSQL en Entity Framework Core

**User Story:** Como desarrollador, quiero que el sistema soporte Npgsql como proveedor de Entity Framework Core para PostgreSQL, para poder conectar la aplicación a una base de datos PostgreSQL.

#### Acceptance Criteria

1. WHEN el valor de "DatabaseProvider" en la Configuración_De_Aplicación es "PostgreSQL", THE Sistema SHALL registrar el ApplicationDbContext utilizando el proveedor Npgsql con la cadena de conexión identificada por la clave "PostgreSQL" en la sección ConnectionStrings
2. WHEN el valor de "DatabaseProvider" en la Configuración_De_Aplicación es "SqlServer", THE Sistema SHALL registrar el ApplicationDbContext utilizando el proveedor SQL Server con la cadena de conexión identificada por la clave "SqlServer" en la sección ConnectionStrings
3. IF el valor de "DatabaseProvider" en la Configuración_De_Aplicación no es "PostgreSQL" ni "SqlServer" (comparación case-sensitive), THEN THE Sistema SHALL lanzar una excepción durante el inicio de la aplicación cuyo mensaje incluya el valor no soportado y la lista de proveedores válidos
4. IF la clave de cadena de conexión correspondiente al proveedor configurado no existe o está vacía en la sección ConnectionStrings, THEN THE Sistema SHALL lanzar una excepción durante el inicio de la aplicación cuyo mensaje indique la clave de conexión faltante y el proveedor solicitado

### Requirement 2: Configuración del proveedor de base de datos mediante appsettings

**User Story:** Como desarrollador, quiero seleccionar el motor de base de datos mediante una entrada en appsettings.json, para poder cambiar de proveedor sin modificar código fuente.

#### Acceptance Criteria

1. THE Configuración_De_Aplicación SHALL contener una propiedad "DatabaseProvider" en la raíz del JSON que acepte únicamente los valores "SqlServer" o "PostgreSQL"
2. THE Configuración_De_Aplicación SHALL contener en la sección "ConnectionStrings" una entrada con clave "SqlServer" para la cadena de conexión a SQL Server y una entrada con clave "PostgreSQL" para la cadena de conexión a PostgreSQL
3. WHEN la aplicación inicia, THE Sistema SHALL leer el valor de "DatabaseProvider" y utilizar la cadena de conexión cuya clave coincida exactamente con dicho valor
4. IF la propiedad "DatabaseProvider" no está presente o es nula en la Configuración_De_Aplicación, THEN THE Sistema SHALL utilizar "SqlServer" como valor por defecto

### Requirement 3: Compatibilidad de las configuraciones de entidades con PostgreSQL

**User Story:** Como desarrollador, quiero que las configuraciones de Entity Framework Core (EmpresaConfiguration, ProyectoConfiguration) funcionen correctamente con PostgreSQL, para que el modelo de datos sea consistente entre ambos proveedores.

#### Acceptance Criteria

1. THE Sistema SHALL aplicar en ambos proveedores (SQL Server y PostgreSQL) las siguientes restricciones definidas en EmpresaConfiguration: clave primaria en Id, Nombre requerido con máximo 200 caracteres, Identificacion requerida con máximo 50 caracteres e índice único, Telefono requerido con máximo 20 caracteres, Direccion requerida con máximo 300 caracteres, EstadoHabilitacion con valor por defecto true, y relación uno-a-muchos con Proyecto con eliminación restringida (Restrict)
2. THE Sistema SHALL aplicar en ambos proveedores (SQL Server y PostgreSQL) las siguientes restricciones definidas en ProyectoConfiguration: clave primaria en Id, Nombre requerido con máximo 200 caracteres, índice único compuesto en (EmpresaId, Nombre), FechaHabilitacion requerida, y EstadoHabilitacion con valor por defecto true
3. WHEN se genera el esquema de base de datos utilizando el proveedor PostgreSQL, THE ApplicationDbContext SHALL producir tablas con las mismas columnas, tipos de datos equivalentes, restricciones NOT NULL, índices únicos, claves foráneas y comportamiento de eliminación que el esquema generado con SQL Server
4. IF una configuración de entidad requiere una función específica de un proveedor que no tiene equivalente directo en el otro proveedor, THEN THE Sistema SHALL utilizar la API condicional de EF Core (HasColumnType, UseProviderMethod, o bloques condicionales por proveedor) para proveer una configuración alternativa que preserve el mismo comportamiento funcional

### Requirement 4: Migraciones independientes por proveedor

**User Story:** Como desarrollador, quiero mantener conjuntos de migraciones separados para SQL Server y PostgreSQL, para poder evolucionar el esquema de cada base de datos de forma independiente.

#### Acceptance Criteria

1. THE Sistema SHALL almacenar las migraciones de SQL Server en el directorio `Migrations/SqlServer` y las migraciones de PostgreSQL en el directorio `Migrations/PostgreSQL`, ambos relativos al proyecto de infraestructura
2. WHEN se genera una nueva migración, THE Sistema SHALL permitir especificar el proveedor objetivo mediante un argumento pasado al comando `dotnet ef migrations add`, aceptando los valores "SqlServer" o "PostgreSQL"
3. IF el argumento de proveedor no se especifica o contiene un valor distinto de "SqlServer" o "PostgreSQL", THEN THE DesignTimeDbContextFactory SHALL utilizar SqlServer como proveedor por defecto
4. WHEN se especifica un proveedor válido, THE DesignTimeDbContextFactory SHALL crear el ApplicationDbContext configurado con el proveedor de base de datos correspondiente al valor recibido

### Requirement 5: Repositorios compartidos entre proveedores

**User Story:** Como desarrollador, quiero que las implementaciones de repositorio existentes funcionen con ambos proveedores sin duplicar código, para mantener una sola implementación que use Entity Framework Core de forma agnóstica al proveedor.

#### Acceptance Criteria

1. THE Sistema SHALL utilizar una única implementación de cada Repositorio (EmpresaRepository, ProyectoRepository, DashboardRepository) para ambos proveedores, sin clases derivadas ni implementaciones alternativas por proveedor
2. THE Sistema SHALL registrar en el Contenedor_DI las mismas asociaciones interfaz-implementación (IEmpresaRepository → EmpresaRepository, IProyectoRepository → ProyectoRepository, IDashboardRepository → DashboardRepository) independientemente del Proveedor_De_Base_De_Datos configurado
3. WHEN se intercambia el Proveedor_De_Base_De_Datos en la Configuración_De_Aplicación, THE Sistema SHALL ejecutar las operaciones CRUD de los Repositorios (crear, leer, actualizar, eliminar) produciendo resultados equivalentes sin modificar el código fuente de las clases de Repositorio ni de la capa Application
4. THE Sistema SHALL restringir las clases de Repositorio al uso exclusivo de APIs agnósticas de proveedor de Entity Framework Core (LINQ, DbSet, DbContext), sin utilizar consultas SQL en texto plano con sintaxis específica de proveedor ni métodos de extensión exclusivos de un proveedor

### Requirement 6: Paquete NuGet para PostgreSQL

**User Story:** Como desarrollador, quiero que el proyecto Infrastructure incluya la dependencia de Npgsql.EntityFrameworkCore.PostgreSQL, para disponer del proveedor EF Core necesario para conectar a PostgreSQL.

#### Acceptance Criteria

1. THE proyecto CompanyProjectManagement.Infrastructure SHALL incluir una referencia PackageReference al paquete Npgsql.EntityFrameworkCore.PostgreSQL con versión mayor 10.x (misma versión mayor que los paquetes Microsoft.EntityFrameworkCore existentes en el proyecto)
2. WHEN se ejecute `dotnet build` sobre la solución CompanyProjectManagement.slnx, THE sistema SHALL completar la compilación sin errores con ambos proveedores referenciados (Microsoft.EntityFrameworkCore.SqlServer y Npgsql.EntityFrameworkCore.PostgreSQL)
3. WHEN se ejecute `dotnet restore` sobre el proyecto CompanyProjectManagement.Infrastructure, THE sistema SHALL resolver todas las dependencias del paquete Npgsql.EntityFrameworkCore.PostgreSQL sin conflictos de versión con los paquetes Microsoft.EntityFrameworkCore ya existentes

### Requirement 7: Validación de conectividad al iniciar la aplicación

**User Story:** Como desarrollador, quiero que la aplicación valide la conectividad a la base de datos configurada durante el inicio, para detectar problemas de conexión de forma temprana.

#### Acceptance Criteria

1. WHEN la aplicación inicia, THE Sistema SHALL intentar una conexión de prueba a la base de datos configurada con un tiempo de espera máximo de 5 segundos
2. IF la conexión de prueba falla o excede el tiempo de espera, THEN THE Sistema SHALL registrar un mensaje en los logs con nivel Warning que incluya el nombre del Proveedor_De_Base_De_Datos configurado y el mensaje de la excepción obtenida
3. IF la conexión de prueba falla o excede el tiempo de espera, THEN THE Sistema SHALL continuar el inicio de la aplicación sin detener la ejecución
4. WHEN la conexión de prueba se completa exitosamente dentro del tiempo de espera, THE Sistema SHALL registrar un mensaje en los logs con nivel Information indicando el nombre del Proveedor_De_Base_De_Datos conectado

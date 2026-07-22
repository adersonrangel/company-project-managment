# Implementation Plan: Administración de Empresas y Proyectos

## Overview

Implementación de una API REST en .NET 10 con Clean Architecture para administración de empresas y proyectos. El plan cubre desde la creación del proyecto hasta las pruebas de integración, siguiendo una estructura incremental donde cada tarea construye sobre la anterior.

## Tasks

- [x] 1. Configurar estructura del proyecto y dependencias
  - [x] 1.1 Crear la solución .NET y los proyectos por capa
    - Ejecutar `dotnet new sln` para crear la solución
    - Crear proyecto Web API: `dotnet new webapi -n CompanyProjectManagement.Api`
    - Crear librería de aplicación: `dotnet new classlib -n CompanyProjectManagement.Application`
    - Crear librería de dominio: `dotnet new classlib -n CompanyProjectManagement.Domain`
    - Crear librería de infraestructura: `dotnet new classlib -n CompanyProjectManagement.Infrastructure`
    - Crear proyecto de pruebas: `dotnet new xunit -n CompanyProjectManagement.Tests`
    - Agregar todos los proyectos a la solución y configurar las referencias entre proyectos (Api→Application→Domain, Infrastructure→Domain, Tests→todos)
    - _Requirements: Estructura base para todos los requisitos_

  - [x] 1.2 Instalar paquetes NuGet necesarios
    - Api: `Microsoft.EntityFrameworkCore.Design`
    - Application: `FluentValidation`, `FluentValidation.DependencyInjectionExtensions`
    - Infrastructure: `Microsoft.EntityFrameworkCore`, `Microsoft.EntityFrameworkCore.SqlServer` (o `Npgsql.EntityFrameworkCore.PostgreSQL`), `Microsoft.EntityFrameworkCore.InMemory`
    - Tests: `FsCheck.Xunit`, `NSubstitute`, `FluentAssertions`, `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.EntityFrameworkCore.InMemory`
    - _Requirements: Dependencias técnicas del diseño_

- [ ] 2. Implementar capa de dominio
  - [ ] 2.1 Crear entidades de dominio (Empresa y Proyecto)
    - Crear clase `Empresa` con propiedades: Id, Nombre (max 200), Identificacion (max 50, único), Telefono (max 20), Direccion (max 300), EstadoHabilitacion (default true), colección de Proyectos
    - Crear clase `Proyecto` con propiedades: Id, Nombre (max 200, único por empresa), FechaHabilitacion (DateOnly), EstadoHabilitacion (default true), EmpresaId (FK), navegación a Empresa
    - _Requirements: 1.4, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2_

  - [ ] 2.2 Crear excepciones personalizadas
    - Crear `EntityNotFoundException` para recursos no encontrados (404)
    - Crear `DuplicateIdentificationException` para identificaciones/nombres duplicados (409)
    - Crear `ReferentialIntegrityException` para violaciones de integridad referencial (409)
    - _Requirements: 1.2, 2.4, 3.2, 3.4, 4.3, 4.4, 5.2, 5.4, 6.3, 6.4, 8.2, 8.3, 9.4, 9.5_

  - [ ] 2.3 Crear interfaces de repositorios
    - Definir `IEmpresaRepository` con métodos: CrearAsync, ListarAsync, ObtenerPorIdAsync, ObtenerPorIdentificacionAsync, ExisteIdentificacionAsync, ActualizarAsync, EliminarAsync, TieneProyectosAsync
    - Definir `IProyectoRepository` con métodos: CrearAsync, ListarPorEmpresaAsync, ObtenerPorIdAsync, ExisteNombreEnEmpresaAsync, ActualizarAsync, EliminarAsync
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 4.1, 5.1, 6.1, 6.2, 7.1, 8.1_

- [ ] 3. Implementar capa de infraestructura (EF Core)
  - [ ] 3.1 Crear DbContext y configuraciones de entidades
    - Crear `ApplicationDbContext` heredando de `DbContext` con DbSets para Empresa y Proyecto
    - Crear `EmpresaConfiguration` (IEntityTypeConfiguration): clave primaria, índice único en Identificacion, longitudes máximas, relación HasMany con Proyecto y DeleteBehavior.Restrict
    - Crear `ProyectoConfiguration` (IEntityTypeConfiguration): clave primaria, índice compuesto único (EmpresaId, Nombre), longitudes máximas, valor por defecto en EstadoHabilitacion
    - _Requirements: 9.1, 9.2, 10.2, 5.4_

  - [ ] 3.2 Implementar repositorios
    - Implementar `EmpresaRepository` usando ApplicationDbContext con todas las operaciones CRUD, incluyendo verificación de existencia de identificación y de proyectos asociados
    - Implementar `ProyectoRepository` usando ApplicationDbContext con todas las operaciones CRUD, incluyendo verificación de nombre único por empresa
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_

  - [ ] 3.3 Crear migración inicial
    - Ejecutar `dotnet ef migrations add InitialCreate` para generar la migración de base de datos
    - _Requirements: Infraestructura de base de datos_

- [ ] 4. Implementar capa de aplicación (DTOs, validadores y servicios)
  - [ ] 4.1 Crear DTOs de solicitud y respuesta
    - Crear records de solicitud: `CrearEmpresaRequest`, `ActualizarEmpresaRequest`, `CrearProyectoRequest`, `ActualizarProyectoRequest`
    - Crear records de respuesta: `EmpresaResponse`, `EmpresaListResponse`, `EmpresaDetalleResponse`, `ProyectoResponse`, `ProyectoListResponse`, `ProyectoDetalleResponse`
    - Crear record `ErrorResponse` con campo Mensaje y diccionario opcional de Errores
    - _Requirements: 1.1, 2.1, 2.3, 5.1, 6.1, 6.2_

  - [ ] 4.2 Crear validadores con FluentValidation
    - Implementar `CrearEmpresaValidator`: Nombre obligatorio (1-200), Identificacion obligatoria (1-50), Telefono obligatorio (1-20, regex dígitos/+/espacios/guiones), Direccion obligatoria (1-300)
    - Implementar `ActualizarEmpresaValidator`: mismas reglas que creación para todos los campos
    - Implementar `CrearProyectoValidator`: Nombre obligatorio (1-200), FechaHabilitacion obligatoria (formato ISO 8601, rango 2000-2099)
    - Implementar `ActualizarProyectoValidator`: al menos un campo presente, validar campos proporcionados
    - _Requirements: 1.3, 1.4, 3.3, 5.3, 7.3, 7.4, 10.1, 10.2, 10.3, 10.4, 10.6, 11.1, 11.2, 11.4_

  - [ ] 4.3 Implementar servicios de Empresa
    - Crear interfaz `IEmpresaService` con métodos: CrearAsync, ListarAsync, ObtenerPorIdAsync, ActualizarAsync, EliminarAsync
    - Implementar `EmpresaService` con lógica de negocio: validación mediante FluentValidation, verificación de unicidad de identificación, verificación de proyectos asociados antes de eliminar, mapeo entre entidades y DTOs
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 10.5, 10.7_

  - [ ] 4.4 Implementar servicios de Proyecto
    - Crear interfaz `IProyectoService` con métodos: CrearAsync, ListarPorEmpresaAsync, ObtenerPorIdAsync, ActualizarAsync, EliminarAsync
    - Implementar `ProyectoService` con lógica de negocio: validación, verificación de existencia de empresa, verificación de unicidad de nombre por empresa, mapeo entre entidades y DTOs
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.4, 11.3_

- [ ] 5. Checkpoint - Verificar compilación y lógica de negocio
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implementar capa de API (Controllers y middleware)
  - [ ] 6.1 Crear middleware de manejo global de errores
    - Implementar `GlobalExceptionMiddleware` que capture: `ValidationException` → 400 con detalle de campos, `EntityNotFoundException` → 404, `DuplicateIdentificationException` → 409, `ReferentialIntegrityException` → 409, excepciones no controladas → 500 genérico
    - Usar el formato estándar `ErrorResponse` para todas las respuestas de error
    - _Requirements: 1.2, 1.3, 2.4, 3.2, 3.3, 3.4, 4.3, 4.4, 5.2, 5.3, 5.4, 6.3, 6.4, 7.2, 7.3, 8.2, 8.3, 9.4, 9.5, 10.6, 10.7, 11.4_

  - [ ] 6.2 Crear EmpresaController
    - Implementar endpoints REST: POST /api/empresas (201 Created), GET /api/empresas (200 OK), GET /api/empresas/{id} (200 OK con proyectos), PUT /api/empresas/{id} (200 OK), DELETE /api/empresas/{id} (204 No Content)
    - Delegar toda la lógica al IEmpresaService
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 4.1_

  - [ ] 6.3 Crear ProyectoController
    - Implementar endpoints REST anidados: POST /api/empresas/{empresaId}/proyectos (201 Created), GET /api/empresas/{empresaId}/proyectos (200 OK), GET /api/empresas/{empresaId}/proyectos/{proyectoId} (200 OK), PUT /api/empresas/{empresaId}/proyectos/{proyectoId} (200 OK), DELETE /api/empresas/{empresaId}/proyectos/{proyectoId} (204 No Content)
    - Delegar toda la lógica al IProyectoService
    - _Requirements: 5.1, 6.1, 6.2, 7.1, 8.1_

  - [ ] 6.4 Configurar inyección de dependencias y Program.cs
    - Registrar DbContext con cadena de conexión
    - Registrar repositorios (IEmpresaRepository → EmpresaRepository, IProyectoRepository → ProyectoRepository)
    - Registrar servicios (IEmpresaService → EmpresaService, IProyectoService → ProyectoService)
    - Registrar validadores de FluentValidation
    - Agregar middleware de manejo global de errores al pipeline
    - _Requirements: Configuración transversal de toda la aplicación_

- [ ] 7. Checkpoint - Verificar que la API compila y endpoints responden
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Pruebas de propiedades (Property-Based Tests)
  - [ ]* 8.1 Crear generadores personalizados (Arbitrary) para FsCheck
    - Crear generador para `CrearEmpresaRequest` con datos válidos respetando restricciones de longitud y patrón de teléfono
    - Crear generador para `CrearProyectoRequest` con datos válidos y fecha en rango correcto (2000-2099)
    - Crear generador para cadenas inválidas (vacías, solo espacios, que exceden longitud máxima)
    - Crear generador para teléfonos con caracteres no permitidos
    - _Requirements: Soporte técnico para Properties 1-12_

  - [ ]* 8.2 Escribir prueba de propiedad: Round-trip de creación de Empresa
    - **Property 1: Round-trip de creación de Empresa**
    - Verificar que para cualquier combinación válida de datos, al crear y consultar una empresa, todos los campos retornados coinciden exactamente
    - **Validates: Requirements 1.1, 2.3, 3.1**

  - [ ]* 8.3 Escribir prueba de propiedad: Round-trip de creación de Proyecto
    - **Property 2: Round-trip de creación de Proyecto**
    - Verificar que para cualquier combinación válida de datos y empresa existente, al crear y consultar un proyecto, todos los campos retornados coinciden y la asociación a empresa es correcta
    - **Validates: Requirements 5.1, 6.2**

  - [ ]* 8.4 Escribir prueba de propiedad: Validación de campos de Empresa rechaza datos inválidos
    - **Property 3: Validación de campos de Empresa rechaza datos inválidos**
    - Verificar que solicitudes con al menos un campo inválido son rechazadas sin crear ni modificar registros
    - **Validates: Requirements 1.3, 1.4, 3.3, 10.1, 10.2, 10.4, 10.6**

  - [ ]* 8.5 Escribir prueba de propiedad: Validación de patrón de Teléfono
    - **Property 4: Validación de patrón de Teléfono**
    - Verificar que cadenas con caracteres fuera del conjunto permitido (dígitos, +, espacios, guiones) son rechazadas
    - **Validates: Requirements 10.3**

  - [ ]* 8.6 Escribir prueba de propiedad: Validación de FechaHabilitación de Proyecto
    - **Property 5: Validación de FechaHabilitación de Proyecto**
    - Verificar que fechas inválidas (formato incorrecto o fuera del rango 2000-2099) son rechazadas
    - **Validates: Requirements 11.2**

  - [ ]* 8.7 Escribir prueba de propiedad: Unicidad de Identificación de Empresa
    - **Property 6: Unicidad de Identificación de Empresa**
    - Verificar que crear o actualizar una empresa con Identificación duplicada es rechazado
    - **Validates: Requirements 1.2, 3.4, 10.7**

  - [ ]* 8.8 Escribir prueba de propiedad: Unicidad de Nombre de Proyecto por Empresa
    - **Property 7: Unicidad de Nombre de Proyecto por Empresa**
    - Verificar que proyectos con el mismo nombre en la misma empresa son rechazados, pero permitidos en empresas diferentes
    - **Validates: Requirements 5.4**

  - [ ]* 8.9 Escribir prueba de propiedad: Integridad referencial — Empresa con Proyectos no eliminable
    - **Property 8: Integridad referencial — Empresa con Proyectos no eliminable**
    - Verificar que eliminar una empresa con proyectos es rechazado y se preservan todos los registros
    - **Validates: Requirements 4.3, 9.5**

  - [ ]* 8.10 Escribir prueba de propiedad: Eliminación permanente de Empresa
    - **Property 9: Eliminación permanente de Empresa**
    - Verificar que tras eliminar una empresa sin proyectos, no aparece en listados ni consultas
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 8.11 Escribir prueba de propiedad: Eliminación permanente de Proyecto
    - **Property 10: Eliminación permanente de Proyecto**
    - Verificar que tras eliminar un proyecto, no aparece en listados ni consultas de su empresa
    - **Validates: Requirements 8.1**

  - [ ]* 8.12 Escribir prueba de propiedad: Consistencia del listado de Empresas
    - **Property 11: Consistencia del listado de Empresas**
    - Verificar que tras crear N empresas con identificaciones únicas, el listado retorna al menos esas N empresas con campos correctos
    - **Validates: Requirements 2.1**

  - [ ]* 8.13 Escribir prueba de propiedad: Consulta de Empresa incluye todos sus Proyectos
    - **Property 12: Consulta de Empresa incluye todos sus Proyectos**
    - Verificar que al consultar una empresa con N proyectos, la respuesta incluye exactamente esos N proyectos
    - **Validates: Requirements 2.3, 6.1, 9.3**

- [ ] 9. Pruebas de integración
  - [ ]* 9.1 Configurar WebApplicationFactory y base de datos en memoria para pruebas
    - Crear clase `CustomWebApplicationFactory` que configure EF Core con base de datos InMemory
    - Configurar un HttpClient de prueba para invocar los endpoints
    - _Requirements: Infraestructura de pruebas_

  - [ ]* 9.2 Escribir pruebas de integración para endpoints de Empresa
    - Probar flujo completo CRUD: crear (201), listar (200), obtener por ID (200 con proyectos), actualizar (200), eliminar (204)
    - Probar casos de error: duplicado de identificación (409), empresa no encontrada (404), validación fallida (400), eliminar con proyectos (409)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 2.4, 3.1, 3.3, 3.4, 4.1, 4.3, 4.4_

  - [ ]* 9.3 Escribir pruebas de integración para endpoints de Proyecto
    - Probar flujo completo CRUD: crear (201), listar por empresa (200), obtener por ID (200), actualizar (200), eliminar (204)
    - Probar casos de error: empresa inexistente (404), proyecto no encontrado (404), nombre duplicado en misma empresa (409), validación fallida (400)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_

- [ ] 10. Checkpoint final - Verificar que todas las pruebas pasan
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Las pruebas de propiedades validan correctitud universal con FsCheck.Xunit
- Las pruebas unitarias e integración validan ejemplos específicos y casos extremos
- El proyecto es greenfield: se crea desde cero sin código existente

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["4.1"] },
    { "id": 6, "tasks": ["4.2"] },
    { "id": 7, "tasks": ["4.3", "4.4"] },
    { "id": 8, "tasks": ["6.1"] },
    { "id": 9, "tasks": ["6.2", "6.3"] },
    { "id": 10, "tasks": ["6.4"] },
    { "id": 11, "tasks": ["8.1", "9.1"] },
    { "id": 12, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 13, "tasks": ["8.7", "8.8", "8.9", "8.10", "8.11", "8.12", "8.13"] },
    { "id": 14, "tasks": ["9.2", "9.3"] }
  ]
}
```

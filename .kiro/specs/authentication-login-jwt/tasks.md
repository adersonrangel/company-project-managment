# Implementation Plan: Autenticación con Login y JWT

## Overview

Este plan convierte el diseño en pasos de codificación incrementales que respetan la arquitectura por capas existente (Domain → Application → Api → Infrastructure) y los patrones del cliente React 19 + TypeScript + Vite. El orden avanza de dominio hacia afuera: primero las piezas de `Domain` sin dependencias, luego la lógica pura de `Application` (hasher, token, validador, servicio), después el cableado en `Api` y la persistencia en `Infrastructure` (ambos proveedores), y finalmente el cliente. Cada tarea construye sobre las anteriores y termina integrándose; no queda código huérfano.

Las pruebas basadas en propiedades (PBT) usan **FsCheck.Xunit** en el backend y **fast-check + Vitest** en el frontend, con mínimo **100 iteraciones**, y se etiquetan con el formato `Feature: authentication-login-jwt, Property {n}: {texto}` según las 14 Correctness Properties del diseño. Las 14 propiedades se distribuyen como sub-tareas junto a la implementación que validan.

## Tasks

- [x] 1. Capa de dominio: entidad, repositorio y excepción
  - [x] 1.1 Crear la entidad `Usuario`, la interfaz `IUsuarioRepository` y la excepción `InvalidCredentialsException`
    - Crear `CompanyProjectManagement.Domain/Entities/Usuario.cs` (POCO con `Id`, `Username`, `PasswordHash`, `PasswordSalt`) siguiendo el estilo de `Empresa.cs`
    - Crear `CompanyProjectManagement.Domain/Repositories/IUsuarioRepository.cs` con `ObtenerPorUsernameAsync`, `ExisteUsernameAsync`, `CrearAsync` (mismo estilo async que `IEmpresaRepository`)
    - Crear `CompanyProjectManagement.Domain/Exceptions/InvalidCredentialsException.cs` siguiendo el patrón de `DuplicateIdentificationException`, con constructor por defecto y mensaje genérico "Usuario o contraseña incorrectos."
    - _Requirements: 4.1, 4.4, 4.5, 1.3, 1.4, 1.6_

- [x] 2. Capa de aplicación: opciones, DTOs y validador
  - [x] 2.1 Crear `JwtOptions`, los DTOs `LoginRequest`/`LoginResponse` y `LoginRequestValidator`
    - Crear `Application/Options/JwtOptions.cs` con `SectionName = "Jwt"`, `SecretKey`, `Issuer`, `Audience`, `ExpirationMinutes = 60`
    - Crear `Application/DTOs/Requests/LoginRequest.cs` (`record LoginRequest(string Username, string Password)`)
    - Crear `Application/DTOs/Responses/LoginResponse.cs` (`record LoginResponse(string Token, int ExpiresIn)`)
    - Crear `Application/Validators/LoginRequestValidator.cs` siguiendo el estilo de `CrearEmpresaValidator`: `Username` y `Password` no vacíos y longitud 1-256, con mensajes que identifican el campo infractor
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 2.2 Escribir prueba de propiedad para `LoginRequestValidator`
    - **Feature: authentication-login-jwt, Property 7: Rechazo de entradas de login fuera de límites**
    - **Validates: Requirements 1.5**
    - FsCheck.Xunit, ≥100 iteraciones; generar `username`/`password` ausente/vacío o de longitud > 256 y verificar que el validador reporta el fallo e identifica el campo infractor

- [x] 3. Capa de aplicación: hashing de contraseñas
  - [x] 3.1 Implementar `IPasswordHasher` / `PasswordHasher` (PBKDF2)
    - Crear `Application/Services/IPasswordHasher.cs` con `(string Hash, string Salt) Hash(string password)` y `bool Verify(string password, string hash, string salt)`
    - Crear `Application/Services/PasswordHasher.cs` usando `Rfc2898DeriveBytes` (SHA-256, iteraciones fijas), sal por usuario en Base64; descartar la contraseña en claro sin persistirla
    - _Requirements: 4.2, 4.3_

  - [x] 3.2 Escribir prueba de propiedad: el hash no expone la contraseña
    - **Feature: authentication-login-jwt, Property 8: El hash no expone la contraseña en claro**
    - **Validates: Requirements 4.2**
    - FsCheck.Xunit, ≥100 iteraciones; verificar que `(hash, sal)` es no vacío y que el hash no es igual ni contiene la contraseña en texto plano

  - [x] 3.3 Escribir prueba de propiedad: round-trip de verificación de contraseña
    - **Feature: authentication-login-jwt, Property 9: Round-trip de verificación de contraseña**
    - **Validates: Requirements 4.3**
    - FsCheck.Xunit, ≥100 iteraciones; `Verify(pw, Hash(pw))` es verdadero y `Verify(pw', Hash(pw))` es falso para `pw != pw'`

- [x] 4. Capa de aplicación: servicio de token JWT
  - [x] 4.1 Implementar `ITokenService` / `JwtTokenService`
    - Crear `Application/Services/ITokenService.cs` con `TokenResult GenerateToken(string userId, string username)` y `record TokenResult(string Token, int ExpiresInSeconds)`
    - Crear `Application/Services/JwtTokenService.cs`: firma HMAC-SHA256 con `SecretKey` desde `JwtOptions` inyectado; `exp = now + ExpirationMinutes`; claims de identificador y nombre de usuario no vacíos
    - Si `userId` o `username` están vacíos → lanzar excepción sin emitir token; si la firma falla → lanzar excepción sin emitir token
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 2.8_

  - [x] 4.2 Escribir prueba de propiedad: round-trip de firma del token
    - **Feature: authentication-login-jwt, Property 1: Round-trip de firma del token**
    - **Validates: Requirements 2.1**
    - FsCheck.Xunit, ≥100 iteraciones; el token generado con la `SecretKey` se valida con esa clave y se rechaza con una clave distinta

  - [x] 4.3 Escribir prueba de propiedad: vigencia del token dentro de la tolerancia
    - **Feature: authentication-login-jwt, Property 2: Vigencia del token dentro de la tolerancia**
    - **Validates: Requirements 1.2, 2.2**
    - FsCheck.Xunit, ≥100 iteraciones; `exp - iat` dentro de [3599, 3600] s y `ExpiresInSeconds == 3600`

  - [x] 4.4 Escribir prueba de propiedad: round-trip de claims
    - **Feature: authentication-login-jwt, Property 3: Round-trip de claims**
    - **Validates: Requirements 2.3**
    - FsCheck.Xunit, ≥100 iteraciones; el token decodificado contiene los claims de `userId` y `username` esperados

  - [x] 4.5 Escribir prueba de propiedad: datos de usuario vacíos impiden la emisión
    - **Feature: authentication-login-jwt, Property 4: Datos de usuario vacíos impiden la emisión**
    - **Validates: Requirements 2.7**
    - FsCheck.Xunit, ≥100 iteraciones; con `userId`/`username` vacíos o solo espacios, `GenerateToken` lanza error y no devuelve token

  - [x] 4.6 Escribir prueba de ejemplo: fallo de firma no emite token
    - Con una `SecretKey` inválida para HMAC, `GenerateToken` lanza sin emitir token
    - _Requirements: 2.8_

- [x] 5. Capa de aplicación: servicio de autenticación
  - [x] 5.1 Implementar `IAuthService` / `AuthService`
    - Crear `Application/Services/IAuthService.cs` con `Task<LoginResponse> LoginAsync(LoginRequest request)`
    - Crear `Application/Services/AuthService.cs` inyectando `IUsuarioRepository`, `IPasswordHasher`, `ITokenService`, `IValidator<LoginRequest>` (mismo patrón de constructor que `EmpresaService`)
    - Lógica: validar con FluentValidation (→ `ValidationException` en fallo); `ObtenerPorUsernameAsync` (null → `InvalidCredentialsException`); `Verify` (falso → `InvalidCredentialsException`); `GenerateToken` → `LoginResponse` con `ExpiresIn = 3600`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 5.2 Escribir prueba de propiedad: credenciales inválidas producen 401
    - **Feature: authentication-login-jwt, Property 5: Credenciales inválidas producen 401**
    - **Validates: Requirements 1.3, 1.4**
    - FsCheck.Xunit, ≥100 iteraciones, con repositorio en memoria/mock; usuario inexistente o contraseña incorrecta → `InvalidCredentialsException`, sin emitir token

  - [x] 5.3 Escribir prueba de propiedad: mensaje de credenciales indistinguible
    - **Feature: authentication-login-jwt, Property 6: Mensaje de credenciales inválidas indistinguible**
    - **Validates: Requirements 1.6**
    - FsCheck.Xunit, ≥100 iteraciones; el mensaje del fallo por usuario inexistente y por contraseña incorrecta es idéntico

- [x] 6. Checkpoint - Ejecutar pruebas de la capa de aplicación
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Capa de infraestructura: persistencia de `Usuario` (ambos proveedores)
  - [x] 7.1 Registrar `Usuario` en el `ApplicationDbContext` y crear su configuración EF
    - Añadir `DbSet<Usuario> Usuarios => Set<Usuario>();` en `Infrastructure.Common/Data/ApplicationDbContext.cs`
    - Crear `Infrastructure.Common/Data/Configurations/UsuarioConfiguration.cs` (`IEntityTypeConfiguration<Usuario>`) siguiendo `EmpresaConfiguration`: clave, `Username` requerido con `HasMaxLength(64)` e **índice único**, `PasswordHash`/`PasswordSalt` requeridos
    - _Requirements: 4.1_

  - [x] 7.2 Implementar `UsuarioRepository`
    - Crear `Infrastructure.Common/Data/Repositories/UsuarioRepository.cs` implementando `IUsuarioRepository` (mismo estilo que `EmpresaRepository`): `ObtenerPorUsernameAsync`, `ExisteUsernameAsync`, `CrearAsync`
    - En `CrearAsync`, ante `Username` duplicado lanzar `DuplicateIdentificationException`; ante `Username` vacío o fuera de [3, 64] lanzar `ValidationException`
    - _Requirements: 4.4, 4.5, 4.6, 4.7_

  - [x] 7.3 Escribir prueba de propiedad: rango de username en persistencia
    - **Feature: authentication-login-jwt, Property 10: Validación del rango de nombre de usuario en persistencia**
    - **Validates: Requirements 4.7**
    - FsCheck.Xunit, ≥100 iteraciones; `username` vacío o de longitud fuera de [3, 64] se rechaza con error de validación y no se persiste

  - [x] 7.4 Generar migración EF y seed del usuario administrador para SqlServer
    - Añadir migración en `Infrastructure.SqlServer/Migrations` (crea la tabla `Usuarios` con índice único en `Username`)
    - Sembrar un usuario administrador con hash/sal generados por `PasswordHasher` (nunca contraseña en texto plano)
    - _Requirements: 4.1, 4.2_

  - [x] 7.5 Generar migración EF y seed del usuario administrador para PostgreSQL
    - Añadir migración en `Infrastructure.PostgreSQL/Migrations` (crea la tabla `Usuarios` con índice único en `Username`)
    - Sembrar el mismo usuario administrador con hash/sal generados por `PasswordHasher`
    - _Requirements: 4.1, 4.2_

- [x] 8. Capa Api: paquete, controlador, configuración JWT y protección de endpoints
  - [x] 8.1 Añadir el paquete JWT Bearer y la sección `Jwt` de configuración
    - Añadir `Microsoft.AspNetCore.Authentication.JwtBearer` a `CompanyProjectManagement.Api.csproj`
    - Añadir la sección `"Jwt"` a `appsettings.json` (`Issuer`, `Audience`, `ExpirationMinutes: 60`, `SecretKey: ""` — la clave se provee vía user-secrets/entorno, no se compromete en el repositorio)
    - _Requirements: 2.4_

  - [x] 8.2 Crear `AuthController`
    - Crear `Api/Controllers/AuthController.cs` con `[ApiController]`, `[Route("api/auth")]`, `POST login` `[AllowAnonymous]` que delega en `IAuthService.LoginAsync` y responde 200 + `LoginResponse` (mismo estilo que `EmpresaController`)
    - _Requirements: 1.1, 1.2, 3.6_

  - [x] 8.3 Configurar autenticación JWT y fail-fast en `Program.cs`
    - Enlazar y validar `JwtOptions` antes de `builder.Build()`; si faltan `SecretKey`, `Issuer` o `Audience` lanzar excepción con mensaje que nombra el parámetro ausente (impide el arranque)
    - `AddAuthentication(JwtBearerDefaults).AddJwtBearer(...)` con `TokenValidationParameters` (valida emisor, audiencia, vida y firma; `ClockSkew = TimeSpan.Zero`) y `AddAuthorization()`
    - Registrar como `Scoped`: `IUsuarioRepository`, `IAuthService`, `ITokenService`, `IPasswordHasher`
    - Añadir `UseAuthentication()` → `UseAuthorization()` antes de `MapControllers()`
    - _Requirements: 2.4, 2.5, 2.6, 3.1, 3.4, 3.5_

  - [x] 8.4 Extender `GlobalExceptionMiddleware` y uniformar el 401 con `JwtBearerEvents`
    - Añadir el mapeo `InvalidCredentialsException → 401` con `ErrorResponse` de mensaje genérico en `GlobalExceptionMiddleware`
    - Configurar `JwtBearerEvents.OnChallenge` en `Program.cs` para devolver un cuerpo `ErrorResponse` uniforme en 401 indicando el motivo (cabecera ausente, malformada, firma inválida o expirado)
    - _Requirements: 1.3, 1.4, 1.6, 3.2, 3.3, 3.4, 3.5_

  - [x] 8.5 Proteger los controladores Dashboard, Empresa y Proyecto
    - Añadir `[Authorize]` a nivel de clase en `DashboardController`, `EmpresaController` y `ProyectoController`
    - _Requirements: 3.7_

- [x] 9. Pruebas de integración y arranque del backend
  - [x]* 9.1 Escribir pruebas de integración del pipeline de autenticación con `WebApplicationFactory`
    - Reutilizar el `public partial class Program { }` existente; configurar `Jwt:SecretKey/Issuer/Audience` de prueba y un almacén de usuarios sembrado (patrón de `CustomWebApplicationFactory`)
    - `POST api/auth/login` responde a la ruta (1.1) y con credenciales válidas devuelve 200 + token (1.2); credenciales inválidas → 401 (1.3, 1.4)
    - Endpoint protegido con Bearer válido → 200 (3.1); sin cabecera → 401 (3.2); cabecera malformada/token vacío → 401 (3.3); firma inválida → 401 (3.4); token expirado con `ClockSkew=0` → 401 (3.5)
    - `api/auth/login` accesible sin token (3.6); `Dashboard`/`Empresa`/`Proyecto` sin token → 401 (3.7)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x]* 9.2 Escribir pruebas de integración del `UsuarioRepository`
    - Crear + recuperar usuario existente (4.4); username inexistente → null sin crear (4.5); username duplicado → 409 preservando el existente (4.6)
    - _Requirements: 4.4, 4.5, 4.6_

  - [x]* 9.3 Escribir pruebas de arranque/configuración (smoke)
    - Construir el host sin `Jwt:SecretKey` → el arranque falla con mensaje que menciona la clave (2.5); sin `Jwt:Issuer` o `Jwt:Audience` → falla nombrando el parámetro (2.6)
    - `JwtTokenService` toma los valores desde `JwtOptions` inyectado (2.4)
    - _Requirements: 2.4, 2.5, 2.6_

- [x] 10. Checkpoint - Ejecutar pruebas del backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Cliente: dependencia, tipos y almacenamiento del token
  - [x] 11.1 Añadir `zod` y crear los tipos de autenticación
    - Añadir `zod` a `dependencies` en `frontend/package.json`
    - Crear `frontend/src/types/auth.ts` con `LoginRequest { username; password }` y `LoginResponse { token; expiresIn }`
    - _Requirements: 8.5_

  - [x] 11.2 Implementar `tokenStorage` sobre `localStorage`
    - Crear `frontend/src/utils/tokenStorage.ts` con `get()`, `set(token): boolean` (captura errores de `localStorage` y devuelve `false`) y `clear()`
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 6.1_

  - [x] 11.3 Escribir pruebas de ejemplo para `tokenStorage`
    - Vitest + Testing Library: `set`→`get` round-trip (5.1); `set` con `localStorage` que lanza → `false` y sin token (5.2)
    - _Requirements: 5.1, 5.2_

- [x] 12. Cliente: esquema de validación Zod
  - [x] 12.1 Crear `loginSchema` (Validador_Login)
    - Crear `frontend/src/schemas/loginSchema.ts` con Zod: `username` `trim().min(3).max(50)` (no solo espacios), `password` `min(8).max(64)`, con mensajes en español que identifican el campo infractor
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 12.2 Escribir prueba de propiedad para `loginSchema`
    - **Feature: authentication-login-jwt, Property 14: El esquema de login es válido solo dentro de los límites**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
    - fast-check + Vitest, ≥100 iteraciones; válido si y solo si `username` recortado ∈ [3, 50] y `password` ∈ [8, 64]; en otro caso inválido con mensaje asociado al campo

- [x] 13. Cliente: interceptores de axios
  - [x] 13.1 Añadir el interceptor de solicitud (Bearer) en `services/api.ts`
    - Extender la instancia `api` existente con un interceptor de solicitud que, si `tokenStorage.get()` existe, añade `Authorization: Bearer <token>`; si no, envía sin cabecera
    - _Requirements: 5.3, 5.4_

  - [x] 13.2 Escribir prueba de propiedad para el interceptor de solicitud
    - **Feature: authentication-login-jwt, Property 11: Adjunto condicional de la cabecera Bearer**
    - **Validates: Requirements 5.3, 5.4, 5.5**
    - fast-check + Vitest, ≥100 iteraciones; la cabecera `Authorization: Bearer <token>` está presente si y solo si existe token almacenado no vacío

  - [x] 13.3 Ampliar el interceptor de respuesta para el manejo de 401 deduplicado en `services/api.ts`
    - Ante `401`: ejecutar `tokenStorage.clear()` y programar redirección a `/login` dentro de 2 s; usar una bandera de módulo (`isHandling401`) para deduplicar 401 concurrentes; rechazar promesas en curso; si `clear()` falla, forzar estado no autenticado y redirección
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 13.4 Escribir prueba de propiedad de deduplicación de 401
    - **Feature: authentication-login-jwt, Property 12: Deduplicación de manejo de 401 concurrentes**
    - **Validates: Requirements 6.5**
    - fast-check + Vitest, ≥100 iteraciones; para n ≥ 1 respuestas 401 concurrentes, la limpieza del token y la redirección se ejecutan exactamente una vez

  - [x] 13.5 Escribir pruebas de ejemplo del interceptor de respuesta
    - Vitest con timers falsos: 401 llama a `clear` (6.1) y redirige a `/login` dentro de 2 s (6.2); `clear` que lanza → sigue no autenticado y redirige (6.3); resultado de solicitud en curso descartado (6.4)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 14. Cliente: servicio de autenticación, contexto y hook
  - [x] 14.1 Implementar `authService`, `AuthContext` y `useAuth`
    - Crear `frontend/src/services/authService.ts` con `login(request): Promise<LoginResponse>` que hace `POST /auth/login` (patrón de `empresaService`)
    - Crear `frontend/src/context/AuthContext.tsx` (`AuthContext` + `AuthProvider`) exponiendo `isAuthenticated`, `login` (guarda token vía `tokenStorage.set`, descarta y muestra error si falla) y `logout` (limpia token)
    - Crear `frontend/src/hooks/useAuth.ts` que consume el contexto
    - _Requirements: 5.1, 5.2, 5.5, 8.5_

- [x] 15. Cliente: guardia de ruta y página de login
  - [x] 15.1 Implementar `ProtectedRoute` (Guardia_Ruta)
    - Crear `frontend/src/components/ProtectedRoute.tsx`: sin token → `<Navigate to="/login" />` sin renderizar hijos; con token → renderiza `<Outlet/>`; ante token inválido/expirado detectado → `clear()` + redirección
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 15.2 Escribir prueba de propiedad para `ProtectedRoute`
    - **Feature: authentication-login-jwt, Property 13: El Guardia_Ruta protege según la presencia de token**
    - **Validates: Requirements 7.1, 7.2**
    - fast-check + Vitest, ≥100 iteraciones; renderiza el contenido protegido si y solo si existe token; en ausencia redirige a `/login` sin renderizar

  - [x] 15.3 Implementar `LoginPage` (Formulario_Login)
    - Crear `frontend/src/pages/LoginPage.tsx`: valida con `loginSchema` en modo `onChange` con debounce ~500 ms; con datos válidos invoca `authService.login`; si un usuario autenticado la visita, redirige a la ruta protegida por defecto
    - _Requirements: 7.5, 8.5, 8.6_

  - [x] 15.4 Escribir pruebas de ejemplo de `LoginPage`
    - Vitest + Testing Library: datos válidos → invoca `authService.login` a `api/auth/login` (8.5); password vacía → inválida (8.2); revalidación de un campo con error dentro de 500 ms con timers falsos (8.6)
    - _Requirements: 8.2, 8.5, 8.6_

- [x] 16. Cliente: cableado del enrutado
  - [x] 16.1 Actualizar `App.tsx` con la ruta pública y las rutas protegidas
    - Añadir `<Route path="/login" element={<LoginPage/>} />` (pública) y envolver la rama `/` con `ProtectedRoute`; envolver el árbol con `AuthProvider`
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [x] 16.2 Escribir pruebas de ejemplo de enrutado
    - Vitest + Testing Library: `/login` accesible sin token (7.4); usuario autenticado en `/login` → redirige a la ruta protegida por defecto (7.5); usuario sin token en ruta protegida → redirige a `/login` (7.1)
    - _Requirements: 7.1, 7.4, 7.5_

- [-] 17. Checkpoint final - Ejecutar todas las pruebas (backend y frontend)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales (pruebas) y pueden omitirse para un MVP más rápido, aunque se recomienda mantenerlas para la trazabilidad de las 14 propiedades.
- Cada tarea referencia los sub-requisitos específicos que aborda para trazabilidad.
- Los checkpoints garantizan validación incremental por capas.
- Las pruebas de propiedad (FsCheck.Xunit y fast-check, ≥100 iteraciones) validan las propiedades universales; las pruebas de ejemplo/integración cubren configuración, efectos de UI y el pipeline HTTP.
- `fast-check`, `vitest` y `@testing-library/react` ya están presentes en el frontend; solo se añade `zod`. En el backend se añade `Microsoft.AspNetCore.Authentication.JwtBearer` (producción); `FsCheck.Xunit` y `Microsoft.AspNetCore.Mvc.Testing` ya se usan en el proyecto de pruebas.
- La `SecretKey` del JWT nunca se compromete en el repositorio: se provee vía `dotnet user-secrets` en desarrollo y variable de entorno en producción.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.3", "4.1", "7.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "5.1", "7.2"] },
    { "id": 4, "tasks": ["5.2", "5.3", "7.3", "7.4", "7.5", "8.1", "8.2"] },
    { "id": 5, "tasks": ["8.3", "8.5"] },
    { "id": 6, "tasks": ["8.4"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["11.1", "11.2", "12.1"] },
    { "id": 9, "tasks": ["11.3", "12.2", "13.1"] },
    { "id": 10, "tasks": ["13.2", "13.3"] },
    { "id": 11, "tasks": ["13.4", "13.5", "14.1"] },
    { "id": 12, "tasks": ["15.1", "15.3"] },
    { "id": 13, "tasks": ["15.2", "15.4", "16.1"] },
    { "id": 14, "tasks": ["16.2"] }
  ]
}
```

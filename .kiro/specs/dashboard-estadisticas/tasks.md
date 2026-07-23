# Implementation Plan: Dashboard de Estadísticas

## Overview

Implementación del Dashboard de Estadísticas como página principal del sistema. Se construye en capas incrementales: primero los DTOs y contratos compartidos, luego el backend (repositorio → servicio → controller), después el frontend (tipos → servicio → utils → hook → componentes), y finalmente la integración y wiring completo.

## Tasks

- [-] 1. Backend: DTOs y contratos de datos
  - [x] 1.1 Crear los DTOs de respuesta del Dashboard
    - Crear `DashboardEstadisticasResponse` y `ProyectosPorEmpresaItem` como records en `CompanyProjectManagement.Application/DTOs/Responses/`
    - Incluir: TotalEmpresas, EmpresasHabilitadas, EmpresasDeshabilitadas, TotalProyectos, ProyectosHabilitados, ProyectosDeshabilitados, ProyectosPorEmpresa
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Crear la interfaz IDashboardRepository
    - Crear en `CompanyProjectManagement.Domain/Repositories/IDashboardRepository.cs`
    - Métodos: ContarEmpresasAsync, ContarEmpresasHabilitadasAsync, ContarProyectosAsync, ContarProyectosHabilitadosAsync, ObtenerProyectosPorEmpresaAsync
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.3 Crear la interfaz IDashboardService
    - Crear en `CompanyProjectManagement.Application/Services/IDashboardService.cs`
    - Método: ObtenerEstadisticasAsync que retorna DashboardEstadisticasResponse
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Backend: Implementación del repositorio y servicio
  - [x] 2.1 Implementar DashboardRepository con EF Core
    - Crear en `CompanyProjectManagement.Infrastructure/Data/Repositories/DashboardRepository.cs`
    - Usar consultas LINQ optimizadas con CountAsync y agrupaciones
    - Filtrar empresas sin proyectos en ObtenerProyectosPorEmpresaAsync
    - Ordenar por CantidadProyectos descendente
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Implementar DashboardService
    - Crear en `CompanyProjectManagement.Application/Services/DashboardService.cs`
    - Orquestar llamadas al repositorio y calcular deshabilitados como (total - habilitados)
    - Retornar DashboardEstadisticasResponse completo
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [x] 2.3 Crear DashboardController
    - Crear en `CompanyProjectManagement.Api/Controllers/DashboardController.cs`
    - Endpoint GET /api/dashboard/estadisticas que retorna 200 con DashboardEstadisticasResponse
    - Inyectar IDashboardService vía constructor
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 2.4 Registrar dependencias en Program.cs
    - Agregar `AddScoped<IDashboardRepository, DashboardRepository>()` y `AddScoped<IDashboardService, DashboardService>()`
    - _Requirements: 1.1_

- [x] 3. Checkpoint - Verificar compilación del backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Frontend: Tipos, servicio y utilidades
  - [x] 4.1 Crear tipos TypeScript para el Dashboard
    - Crear `src/types/dashboard.ts` con interfaces DashboardEstadisticas y ProyectosPorEmpresa
    - Mapear propiedades en camelCase acorde al contrato JSON del backend
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 4.2 Crear dashboardService
    - Crear `src/services/dashboardService.ts`
    - Función obtenerEstadisticas que hace GET a `/dashboard/estadisticas` con timeout de 10s
    - Reutilizar la instancia de axios existente en `api.ts`
    - _Requirements: 1.1, 6.2_

  - [x] 4.3 Implementar funciones utilitarias (dashboardUtils)
    - Crear `src/utils/dashboardUtils.ts`
    - Implementar: `calcularPorcentaje(valor, total, decimales)`, `truncarNombre(nombre, maxLength)`, `prepararDatosBarras(datos, maxItems)`
    - calcularPorcentaje: retorna porcentaje redondeado a N decimales
    - truncarNombre: trunca a maxLength caracteres + "..." si excede
    - prepararDatosBarras: ordena descendente, toma top-N items
    - _Requirements: 3.2, 4.2, 5.1, 5.2, 5.4_

  - [x] 4.4 Write property tests para dashboardUtils
    - **Property 3: Corrección del cálculo de porcentajes**
    - **Property 4: Preparación de datos de gráfica de barras (top-N + orden descendente)**
    - **Property 5: Truncamiento de nombres**
    - **Validates: Requirements 3.2, 4.2, 5.1, 5.2, 5.4**
    - Usar fast-check con mínimo 100 iteraciones por propiedad
    - Crear en `src/utils/__tests__/dashboardUtils.test.ts`

- [x] 5. Frontend: Hook useDashboard
  - [x] 5.1 Implementar el hook useDashboard
    - Crear `src/hooks/useDashboard.ts`
    - Gestionar estados: loading, data, error
    - Implementar lógica de reintentos (máximo 3)
    - Exponer: data, loading, error, retry, retryCount, maxRetriesReached
    - Llamar a dashboardService.obtenerEstadisticas al montar
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 5.2 Write unit tests para useDashboard
    - Testear estados de loading, success y error
    - Testear lógica de reintentos y deshabilitación tras 3 fallos
    - Crear en `src/hooks/__tests__/useDashboard.test.ts`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [-] 6. Frontend: Componentes de presentación
  - [x] 6.1 Implementar componente TarjetaResumen
    - Crear `src/components/TarjetaResumen.tsx` y `src/components/TarjetaResumen.css`
    - Props: valor (number), etiqueta (string), icono (ReactNode opcional)
    - Mostrar valor numérico como texto y etiqueta descriptiva
    - Ancho mínimo 280px, ocupar ancho disponible del contenedor
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 7.5_

  - [x] 6.2 Implementar componente GraficaEstadoEmpresas
    - Crear `src/components/GraficaEstadoEmpresas.tsx`
    - Usar Recharts PieChart con innerRadius para efecto donut
    - Mostrar 2 segmentos: habilitadas y deshabilitadas
    - Etiquetas con nombre y porcentaje (1 decimal)
    - Tooltip con nombre del segmento y cantidad absoluta
    - Estado vacío si total es 0
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.3 Implementar componente GraficaEstadoProyectos
    - Crear `src/components/GraficaEstadoProyectos.tsx`
    - Usar Recharts PieChart con innerRadius para efecto donut
    - Mostrar 2 segmentos: habilitados y deshabilitados
    - Etiquetas con nombre y porcentaje (entero más cercano)
    - Tooltip con nombre del segmento y cantidad absoluta
    - Estado vacío si total es 0
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.4 Implementar componente GraficaProyectosPorEmpresa
    - Crear `src/components/GraficaProyectosPorEmpresa.tsx`
    - Usar Recharts BarChart con barras verticales
    - Usar prepararDatosBarras para top 10 y orden descendente
    - Eje X con nombres truncados (20 chars + "...")
    - Eje Y con cantidad de proyectos
    - Tooltip con nombre completo y número de proyectos
    - Estado vacío si no hay datos
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.5 Implementar componentes DashboardLoading y DashboardError
    - Crear `src/components/DashboardLoading.tsx` con spinner centrado
    - Crear `src/components/DashboardError.tsx` con mensaje de error, botón de reintento y estado deshabilitado
    - Props de DashboardError: onRetry, disabled, mensaje
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [-] 7. Frontend: Página DashboardPage y wiring
  - [x] 7.1 Implementar DashboardPage
    - Modificar `src/pages/HomePage.tsx` para integrar el dashboard
    - Usar useDashboard hook para obtener datos
    - Renderizar condicionalmente: DashboardLoading, DashboardError, o contenido del dashboard
    - Mostrar 4 TarjetaResumen: total empresas, total proyectos, empresas habilitadas, proyectos habilitados
    - Incluir las 3 gráficas: GraficaEstadoEmpresas, GraficaEstadoProyectos, GraficaProyectosPorEmpresa
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 6.1, 6.2_

  - [x] 7.2 Implementar layout responsivo del Dashboard
    - Crear `src/pages/HomePage.css` con estilos del dashboard
    - Tarjetas: fila horizontal de 4 en ≥1024px, grid 2x2 en <1024px
    - Gráficas: layout 2 columnas en ≥1024px, 1 columna en <1024px
    - Usar CSS Grid o Flexbox con media queries a 1024px breakpoint
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Checkpoint - Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Tests de componentes
  - [x] 9.1 Write unit tests para TarjetaResumen
    - **Property 6: Renderizado de TarjetaResumen**
    - **Validates: Requirements 2.5, 2.7**
    - Verificar que renderiza valor numérico y etiqueta como texto visible
    - Usar fast-check con mínimo 100 iteraciones
    - Crear en `src/components/__tests__/TarjetaResumen.test.tsx`

  - [x] 9.2 Write unit tests para componentes de gráficas
    - Testear GraficaEstadoEmpresas, GraficaEstadoProyectos y GraficaProyectosPorEmpresa
    - Verificar renderizado con datos, estado vacío, y tooltips
    - Crear en `src/components/__tests__/`
    - _Requirements: 3.1, 3.4, 4.1, 4.4, 5.1, 5.5_

  - [x] 9.3 Write unit tests para DashboardPage
    - Testear estados: loading, error, datos cargados
    - Verificar que se muestran 4 tarjetas con valores correctos
    - Verificar layout responsivo (mock de matchMedia)
    - Crear en `src/pages/__tests__/HomePage.test.tsx`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3, 7.1, 7.2_

- [x] 10. Final checkpoint - Verificar todo el sistema
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada task referencia requerimientos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Property tests validan propiedades universales de corrección (calcularPorcentaje, truncarNombre, prepararDatosBarras, TarjetaResumen)
- Unit tests validan ejemplos específicos y casos borde
- El backend sigue la arquitectura de capas existente: Domain → Application → Infrastructure → Api
- El frontend sigue los patrones existentes: types, services, utils, hooks, components, pages
- fast-check ya está instalado en el proyecto frontend
- Recharts debe instalarse como dependencia (`npm install recharts`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "4.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "4.2", "4.3"] },
    { "id": 2, "tasks": ["2.3", "2.4", "4.4", "5.1"] },
    { "id": 3, "tasks": ["5.2", "6.1", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 4, "tasks": ["7.1", "7.2"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3"] }
  ]
}
```

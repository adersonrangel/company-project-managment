# Implementation Plan: Reparación de la suite de pruebas (empresa-proyecto-test-failures-investigation)

## Overview

Investigación de reparación de pruebas (test-repair). Las 19 fallas en 4 archivos están clasificadas en el diseño como **Deriva_de_Prueba**: las expectativas de las pruebas quedaron desactualizadas respecto al contrato vigente (tipo `Empresa` de 5 campos, contrato de `submitting` del `EmpresaFormModal`, y uso de `ConfirmDialog` en `ProyectosPage`). Todas las correcciones son **exclusivamente del lado de las pruebas**. NO se modifica código de producción (`useEmpresaForm.ts`, `EmpresaFormModal.tsx`, `ProyectosPage.tsx`, `ConfirmDialog.tsx`, tipos ni servicios).

Causa raíz aguas arriba compartida (Clústeres A y B): las pruebas omiten el campo obligatorio `identificacion`, por lo que `handleSubmit` se corta en la validación antes de invocar al servicio y antes de que `submitting` sea `true`. La corrección estructural es proveer un `identificacion` válido en cada prueba afectada.

Cada tarea termina re-ejecutando el archivo de prueba afectado para ser verificable.

## Tasks

- [x] 1. Establecer y registrar la línea base de fallas
  - Ejecutar `npx vitest run` sobre el estado actual del repositorio y capturar la salida.
  - Documentar el total de 19 pruebas fallidas distribuidas en exactamente 4 archivos: `frontend/src/hooks/__tests__/useEmpresaForm.test.ts`, `frontend/src/pages/__tests__/EmpresasPage.integration.test.tsx`, `frontend/src/components/__tests__/EmpresaFormModal.test.tsx`, `frontend/src/pages/__tests__/ProyectosPage.test.tsx`.
  - Registrar, para cada prueba fallida, su nombre y la razón de la falla, y asignarla a Clúster_A, Clúster_B o Clúster_C (15 / 4 / 1 respectivamente).
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Clúster A — Corregir `frontend/src/hooks/__tests__/useEmpresaForm.test.ts` (10 pruebas de forma de formulario)
  - [x] 2.1 Actualizar las pruebas de inicialización al conjunto de 5 campos
    - En "initialize with empty fields in create mode", esperar `formData` = `{ nombre: '', identificacion: '', direccion: '', telefono: '', estadoHabilitacion: true }`.
    - En "initialize with empresaInicial data in edit mode", añadir `identificacion` y `estadoHabilitacion` copiados desde `empresaInicial` al objeto `formData` esperado.
    - _Requisitos: 3.1, 3.2_

  - [x] 2.2 Actualizar las pruebas de éxito de crear/editar para que pasen validación y afirmen el payload de 5 campos
    - En "call crear with correct data and callbacks", establecer un `identificacion` válido vía `handleChange('identificacion', ...)` (o usar `validFormData.identificacion`), y esperar que `empresaService.crear` sea invocado con el payload de 5 campos (`nombre, identificacion, direccion, telefono, estadoHabilitacion`) y el segundo argumento `{ timeout: 30000 }`.
    - En "call actualizar with id and correct data", esperar `empresaService.actualizar` con `empresaInicial.id`, el payload de 5 campos y `{ timeout: 30000 }`.
    - _Requisitos: 2.5, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.3 Actualizar las pruebas de error de servidor para alcanzar el bloque `catch`
    - En las pruebas 400, 409, 500 y timeout (`ECONNABORTED`), establecer un `identificacion` válido antes de simular la respuesta para que la validación pase y el flujo llegue al `catch`.
    - En "clears errorServidor when any field changes", establecer un `identificacion` válido para provocar primero el error de servidor y luego verificar su limpieza al cambiar un campo.
    - _Requisitos: 2.5, 3.4_

  - [x] 2.4 Re-ejecutar el archivo del hook y confirmar las pruebas del Clúster A en verde
    - Ejecutar `npx vitest run frontend/src/hooks/__tests__/useEmpresaForm.test.ts` y confirmar que las pruebas de forma de formulario pasan (la prueba de `submitting` se aborda en la tarea 5).
    - _Requisitos: 6.1, 6.3, 7.3_

- [x] 3. Clúster A — Corregir `frontend/src/pages/__tests__/EmpresasPage.integration.test.tsx` (5 pruebas)
  - [x] 3.1 Rellenar el input "Identificación" y afirmar el payload de 5 campos
    - En "create a new empresa (full creation flow)" y "call crear for new empresa", rellenar el input "Identificación" del modal antes de enviar; esperar `empresaService.crear` con el payload de 5 campos y `{ timeout: 30000 }`.
    - En "edit an existing empresa (full edit flow)" y "call actualizar with correct id for edit", esperar `empresaService.actualizar` con el id correcto, el payload de 5 campos (incluyendo los precargados desde la fila) y `{ timeout: 30000 }`.
    - En "keep modal open with error 500", rellenar "Identificación" para que el envío llegue al error de servidor y el modal permanezca abierto.
    - _Requisitos: 3.4, 3.5, 3.6_

  - [x] 3.2 Re-ejecutar el archivo de integración y confirmar en verde
    - Ejecutar `npx vitest run frontend/src/pages/__tests__/EmpresasPage.integration.test.tsx` y confirmar 0 fallas.
    - _Requisitos: 6.1, 6.3, 7.3_

- [x] 4. Clúster B — Corregir `frontend/src/components/__tests__/EmpresaFormModal.test.tsx` (3 pruebas)
  - [x] 4.1 Proveer `identificacion` válido para que `submitting` se vuelva `true`
    - En "does NOT close on Escape during submit", "does NOT close on overlay click during submit" y "Save button shows 'Guardando...' and disabled during submit", rellenar el input "Identificación" con un valor válido para que la validación pase y `submitting` sea `true`.
    - Aprovechar que el mock del servicio ya devuelve una promesa pendiente (`new Promise(() => {})`) para mantener el botón "Guardando..." (deshabilitado) renderizado durante la aserción.
    - NO modificar el componente `EmpresaFormModal`; solo ajustar la prueba.
    - _Requisitos: 4.1, 4.2, 4.4, 4.6_

  - [x] 4.2 Re-ejecutar el archivo del modal y confirmar en verde
    - Ejecutar `npx vitest run frontend/src/components/__tests__/EmpresaFormModal.test.tsx` y confirmar 0 fallas.
    - _Requisitos: 6.1, 6.3, 7.3_

- [x] 5. Clúster B — Corregir la prueba de ciclo de vida de `submitting` en `frontend/src/hooks/__tests__/useEmpresaForm.test.ts`
  - [x] 5.1 Hacer avanzar el envío en "should set submitting to true during async operation and false after"
    - Establecer un `identificacion` válido vía `handleChange` para que la validación pase y el envío con la promesa controlada (`resolvePromise`) proceda; confirmar `submitting` `true` durante la operación y `false` tras resolver.
    - En el registro de la línea base/notas, documentar que esta falla es Deriva_de_Prueba (misma causa que el Clúster A) y NO un defecto real del ciclo de vida de `submitting`.
    - _Requisitos: 4.3, 4.5_

  - [x] 5.2 Re-ejecutar el archivo del hook y confirmar la prueba de `submitting` en verde
    - Ejecutar `npx vitest run frontend/src/hooks/__tests__/useEmpresaForm.test.ts` y confirmar que todas las pruebas del archivo pasan.
    - _Requisitos: 6.1, 6.3, 7.3_

- [x] 6. Clúster C — Corregir la prueba de eliminación en `frontend/src/pages/__tests__/ProyectosPage.test.tsx`
  - [x] 6.1 Reemplazar el espía de `window.confirm` por interacción con `ConfirmDialog`
    - En "should delete a proyecto: click 'Eliminar' → confirm → row removed + success notification", eliminar el espía y la aserción sobre `window.confirm`.
    - Tras hacer clic en el botón "Eliminar" de la fila, localizar el diálogo (`role=dialog`) y hacer clic en su botón de confirmación "Eliminar" acotando la consulta con `within(dialog)` para evitar la colisión de nombres.
    - Afirmar que `proyectoService.eliminar` se invoca con `(1, 1)`, que la fila se remueve de la tabla y que se muestra la notificación "Proyecto eliminado exitosamente".
    - NO modificar `ProyectosPage` ni `ConfirmDialog`; solo ajustar la prueba.
    - _Requisitos: 5.1, 5.3, 5.4, 5.5_

  - [x] 6.2 Re-ejecutar el archivo de la página de proyectos y confirmar en verde
    - Ejecutar `npx vitest run frontend/src/pages/__tests__/ProyectosPage.test.tsx` y confirmar 0 fallas, verificando que la acotación con `within(dialog)` no rompió otras consultas del archivo.
    - _Requisitos: 6.1, 6.3, 6.4_

- [x] 7. Checkpoint final — Suite completa en verde sin regresiones
  - Ejecutar `npx vitest run` (suite completa) y confirmar 0 pruebas fallidas.
  - Verificar que ninguna prueba previamente en verde haya regresado y que no se eliminó, deshabilitó ni debilitó ninguna prueba no relacionada para forzar el estado verde.
  - Asegurarse de que todas las pruebas pasan; consultar al usuario si surgen dudas.
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 7.1, 7.3_

## Notes

- Todas las correcciones son del lado de las pruebas (Deriva_de_Prueba). No se modifica código de producción (Requisitos 7.1, 7.3).
- La causa raíz compartida de los Clústeres A y B es la omisión del campo obligatorio `identificacion` en las pruebas.
- El Clúster C es independiente: la prueba espiaba `window.confirm` mientras la implementación usa `ConfirmDialog`.
- No se incluyen pruebas basadas en propiedades (PBT): el diseño declara explícitamente que no aplica.
- Cada tarea termina re-ejecutando el archivo afectado para verificación incremental; el checkpoint final valida la suite completa.
- Atención a la colisión de nombres accesibles "Eliminar" en `ProyectosPage.test.tsx`: acotar con `within(dialog)`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "4.1", "6.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "4.2", "6.2"] },
    { "id": 2, "tasks": ["2.3"] },
    { "id": 3, "tasks": ["2.4"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2"] }
  ]
}
```

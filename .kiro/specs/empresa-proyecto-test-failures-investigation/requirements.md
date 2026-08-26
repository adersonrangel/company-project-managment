# Requirements Document

## Introduction

Esta especificación define una investigación de diagnóstico y reparación de la suite de pruebas del frontend. No es una funcionalidad nueva de producto. Al completar el bugfix `collapsed-menu-icon-centering` (cambio exclusivamente de CSS y no relacionado con estas fallas) se descubrió que la suite de pruebas del frontend presenta 19 pruebas fallidas distribuidas en 4 archivos, verificadas mediante `npx vitest run`.

El objetivo de esta investigación es triar cada falla, determinar para CADA una si la causa raíz es que la expectativa de la PRUEBA quedó desactualizada (Deriva_de_Prueba) o si la IMPLEMENTACIÓN es incorrecta (Regresion_de_Implementacion), definir el comportamiento correcto esperado para que las pruebas y la implementación coincidan, restaurar la suite a estado verde (0 fallas) y prevenir la recurrencia. No se debe asumir que las pruebas son la fuente de verdad: algunas pruebas pueden reflejar el comportamiento previsto que la implementación regresó.

Las 19 fallas se agrupan en tres clústeres:

- **Clúster A — Deriva de la forma del formulario de Empresa (crear/editar):** 15 fallas en `frontend/src/hooks/__tests__/useEmpresaForm.test.ts` (10) y `frontend/src/pages/__tests__/EmpresasPage.integration.test.tsx` (5).
- **Clúster B — Estado de envío ("Guardando...") no encontrado:** 3 fallas en `frontend/src/components/__tests__/EmpresaFormModal.test.tsx`, más 1 falla relacionada del hook en `useEmpresaForm.test.ts`.
- **Clúster C — Confirmación de eliminación de Proyecto no invocada:** 1 falla en `frontend/src/pages/__tests__/ProyectosPage.test.tsx`.

El bugfix previo `collapsed-menu-icon-centering` queda explícitamente FUERA DEL ALCANCE de esta investigación.

## Glossary

- **Suite_de_Pruebas**: Conjunto de pruebas del frontend ejecutado mediante el comando `npx vitest run`.
- **Linea_Base**: Registro documentado del estado actual de fallas, incluyendo los cuatro archivos afectados y la razón de falla por prueba, reproducido con `npx vitest run`.
- **Deriva_de_Prueba**: Causa raíz en la que la expectativa de una prueba quedó desactualizada respecto al comportamiento previsto vigente, por lo que la prueba debe actualizarse.
- **Regresion_de_Implementacion**: Causa raíz en la que el código de producción dejó de cumplir el comportamiento previsto, por lo que la implementación debe corregirse.
- **Fuente_Autoritativa**: Documento o artefacto que define el comportamiento previsto. Incluye las especificaciones `add-empresa-ui-form` y `add-proyecto-ui-form`, y los tipos `Empresa` (`frontend/src/types/empresa.ts`) y `Proyecto` (`frontend/src/types/proyecto.ts`).
- **Clúster_A**: Grupo de fallas relacionadas con el conjunto de campos del formulario de Empresa en los archivos `useEmpresaForm.test.ts` y `EmpresasPage.integration.test.tsx`.
- **Clúster_B**: Grupo de fallas relacionadas con el estado de envío del formulario de Empresa en el archivo `EmpresaFormModal.test.tsx` y una prueba relacionada del hook.
- **Clúster_C**: Falla relacionada con el flujo de confirmación de eliminación de Proyecto en el archivo `ProyectosPage.test.tsx`.
- **Hook_Empresa**: Hook `useEmpresaForm` definido en `frontend/src/hooks/useEmpresaForm.ts`.
- **Modal_Empresa**: Componente `EmpresaFormModal` definido en `frontend/src/components/EmpresaFormModal.tsx`.
- **Servicio_Empresa**: Servicio `empresaService` definido en `frontend/src/services/empresaService.ts`, con los métodos `crear` y `actualizar`.
- **Servicio_Proyecto**: Servicio `proyectoService` definido en `frontend/src/services/proyectoService.ts`, con el método `eliminar`.
- **Pagina_Proyectos**: Componente `ProyectosPage` definido en `frontend/src/pages/ProyectosPage.tsx`.
- **Dialogo_Confirmacion**: Componente `ConfirmDialog` (`frontend/src/components/ConfirmDialog.tsx`) usado por la Pagina_Proyectos para confirmar la eliminación de un proyecto.
- **Conjunto_de_Campos_Empresa**: Conjunto de campos que el formulario de Empresa gestiona y envía al Servicio_Empresa.
- **Estado_Submitting**: Bandera booleana `submitting` gestionada por el Hook_Empresa que indica si hay un envío en curso.
- **Investigador**: Rol que ejecuta la investigación, clasifica las causas raíz, define el comportamiento correcto y aplica las correcciones.

## Requirements

### Requirement 1: Enumeración y reproducción de la línea base de fallas

**User Story:** Como desarrollador que mantiene la suite de pruebas, quiero una línea base documentada de las 19 fallas actuales, para tener un punto de referencia verificable antes de aplicar cualquier corrección.

#### Acceptance Criteria

1. WHEN el Investigador ejecuta el comando `npx vitest run` sobre el estado actual del repositorio, THE Investigador SHALL registrar una Linea_Base que confirme un total de 19 pruebas fallidas distribuidas en exactamente 4 archivos.
2. THE Linea_Base SHALL identificar los 4 archivos afectados: `frontend/src/hooks/__tests__/useEmpresaForm.test.ts`, `frontend/src/pages/__tests__/EmpresasPage.integration.test.tsx`, `frontend/src/components/__tests__/EmpresaFormModal.test.tsx` y `frontend/src/pages/__tests__/ProyectosPage.test.tsx`.
3. THE Linea_Base SHALL documentar, para cada una de las 19 pruebas fallidas, el nombre de la prueba y la razón de la falla.
4. THE Linea_Base SHALL asignar cada prueba fallida a uno de los tres clústeres: Clúster_A, Clúster_B o Clúster_C.
5. THE Linea_Base SHALL registrar 15 fallas en el Clúster_A, 4 fallas en el Clúster_B y 1 falla en el Clúster_C.

### Requirement 2: Clasificación de causa raíz por clúster

**User Story:** Como desarrollador, quiero que cada clúster de fallas tenga su causa raíz clasificada como Deriva_de_Prueba o Regresion_de_Implementacion con referencia a la fuente autoritativa, para poder decidir con fundamento si corregir las pruebas o la implementación.

#### Acceptance Criteria

1. THE Investigador SHALL clasificar la causa raíz de cada uno de los tres clústeres (Clúster_A, Clúster_B, Clúster_C) como Deriva_de_Prueba o como Regresion_de_Implementacion.
2. WHEN el Investigador clasifica la causa raíz de un clúster, THE Investigador SHALL citar la Fuente_Autoritativa que define el comportamiento previsto en el cual se basa la clasificación.
3. WHERE una falla involucra el conjunto de campos del formulario de Empresa, THE Investigador SHALL cotejar el comportamiento previsto contra la especificación `add-empresa-ui-form` y contra el tipo `Empresa` en `frontend/src/types/empresa.ts`.
4. WHERE una falla involucra el flujo de eliminación de Proyecto, THE Investigador SHALL cotejar el comportamiento previsto contra la especificación `add-proyecto-ui-form` y contra el tipo `Proyecto` en `frontend/src/types/proyecto.ts`.
5. IF la Fuente_Autoritativa contradice la expectativa de una prueba, THEN THE Investigador SHALL clasificar esa prueba como Deriva_de_Prueba y registrar la corrección requerida en la prueba.
6. IF la Fuente_Autoritativa contradice el comportamiento observado de la implementación, THEN THE Investigador SHALL clasificar el caso como Regresion_de_Implementacion y registrar la corrección requerida en la implementación.

### Requirement 3: Definición del conjunto de campos correcto del formulario de Empresa (Clúster A)

**User Story:** Como desarrollador, quiero una definición explícita y acordada del conjunto de campos que el formulario de Empresa debe gestionar y enviar, para que las pruebas del Clúster_A y la implementación coincidan sin ambigüedad.

#### Acceptance Criteria

1. THE Investigador SHALL definir el Conjunto_de_Campos_Empresa autoritativo que el Hook_Empresa debe gestionar en los modos crear y editar.
2. WHEN el Investigador define el Conjunto_de_Campos_Empresa, THE Investigador SHALL cotejarlo con los campos del tipo `Empresa` (`nombre`, `identificacion`, `direccion`, `telefono`, `estadoHabilitacion`) y con la especificación `add-empresa-ui-form`.
3. THE Investigador SHALL determinar si el argumento de opciones `{ timeout: 30000 }` en las llamadas `empresaService.crear` y `empresaService.actualizar` forma parte del contrato previsto o si debe eliminarse.
4. WHERE el Conjunto_de_Campos_Empresa definido difiera de los campos esperados por las pruebas de `useEmpresaForm.test.ts` y `EmpresasPage.integration.test.tsx`, THE Investigador SHALL registrar la actualización requerida en dichas pruebas para reflejar el Conjunto_de_Campos_Empresa definido.
5. WHEN se aplique la corrección del Clúster_A, THE Hook_Empresa SHALL invocar `empresaService.crear` y `empresaService.actualizar` con exactamente el Conjunto_de_Campos_Empresa definido y con la firma de opciones acordada.
6. WHEN se aplique la corrección del Clúster_A en modo edición, THE Hook_Empresa SHALL invocar `empresaService.actualizar` con el identificador numérico de la empresa y el Conjunto_de_Campos_Empresa definido.

### Requirement 4: Definición del contrato de estado de envío del formulario de Empresa (Clúster B)

**User Story:** Como desarrollador, quiero un contrato claro del estado de envío del formulario de Empresa (etiqueta del botón y ciclo de vida de `submitting`), para que las pruebas del Clúster_B verifiquen el comportamiento previsto correctamente.

#### Acceptance Criteria

1. THE Investigador SHALL definir el contrato de UX del estado de envío del Modal_Empresa, incluyendo el texto de la etiqueta del botón de envío durante el envío y su estado deshabilitado.
2. WHILE un envío está en curso, THE Modal_Empresa SHALL mostrar un botón con el nombre accesible "Guardando..." y en estado deshabilitado.
3. THE Investigador SHALL definir el ciclo de vida correcto del Estado_Submitting del Hook_Empresa, especificando que el valor es `true` mientras la promesa del Servicio_Empresa está pendiente y `false` una vez que la promesa se resuelve o se rechaza.
4. THE Investigador SHALL determinar, para cada prueba del Clúster_B, si la falla se debe a Deriva_de_Prueba (la prueba no mantiene la promesa del servicio pendiente el tiempo suficiente o afirma una etiqueta no vigente) o a Regresion_de_Implementacion (el Modal_Empresa o el Hook_Empresa no cumplen el contrato definido).
5. THE Investigador SHALL determinar si la prueba "should set submitting to true during async operation and false after" refleja un defecto real del ciclo de vida del Estado_Submitting o una limitación en la forma en que la prueba mantiene abierta la promesa.
6. WHEN se aplique la corrección del Clúster_B, THE Modal_Empresa y THE Hook_Empresa SHALL cumplir el contrato de estado de envío definido, y las pruebas del Clúster_B SHALL verificar ese contrato.

### Requirement 5: Definición del flujo de confirmación de eliminación de Proyecto (Clúster C)

**User Story:** Como desarrollador, quiero una definición clara del flujo de confirmación de eliminación de un proyecto, para que la prueba del Clúster_C verifique el mecanismo de confirmación realmente previsto.

#### Acceptance Criteria

1. THE Investigador SHALL definir el mecanismo de confirmación previsto que la Pagina_Proyectos debe usar antes de eliminar un proyecto, especificando si se usa el diálogo nativo `window.confirm` o el componente Dialogo_Confirmacion.
2. WHEN el Investigador define el mecanismo de confirmación, THE Investigador SHALL cotejarlo con la implementación vigente de la Pagina_Proyectos y con la especificación `add-proyecto-ui-form`.
3. THE Investigador SHALL determinar si la prueba "should delete a proyecto: click 'Eliminar' → confirm → row removed + success notification" falla porque la Pagina_Proyectos dejó de invocar `window.confirm` (Regresion_de_Implementacion) o porque la prueba espía `window.confirm` mientras la implementación usa el Dialogo_Confirmacion (Deriva_de_Prueba).
4. WHEN el usuario confirma la eliminación mediante el mecanismo de confirmación definido, THE Pagina_Proyectos SHALL invocar `proyectoService.eliminar` con el identificador de la empresa y el identificador del proyecto, eliminar la fila correspondiente de la tabla y mostrar una notificación de éxito.
5. WHEN se aplique la corrección del Clúster_C, THE prueba del Clúster_C SHALL verificar el mecanismo de confirmación definido en lugar de un mecanismo que no está en uso.

### Requirement 6: Criterio de salida de suite en verde

**User Story:** Como desarrollador, quiero un criterio de salida verificable, para confirmar que la investigación restauró la suite a estado verde sin degradar la cobertura.

#### Acceptance Criteria

1. WHEN el Investigador ejecuta `npx vitest run` tras aplicar todas las correcciones, THE Suite_de_Pruebas SHALL reportar 0 pruebas fallidas.
2. THE Investigador SHALL resolver las 19 fallas de la Linea_Base sin eliminar ni deshabilitar pruebas no relacionadas para forzar el estado verde.
3. THE Investigador SHALL conservar la intención de verificación de cada prueba corregida, ajustando únicamente las expectativas que la clasificación identificó como Deriva_de_Prueba.
4. IF una corrección introduce una nueva falla en una prueba previamente en verde, THEN THE Investigador SHALL resolver esa nueva falla antes de considerar cumplido el criterio de salida.

### Requirement 7: Preservación del comportamiento de producto previsto

**User Story:** Como responsable del producto, quiero garantizar que las correcciones no cambien silenciosamente el comportamiento previsto solo para satisfacer una prueba desactualizada, para que la suite verde siga reflejando el producto correcto.

#### Acceptance Criteria

1. THE Investigador SHALL confirmar el comportamiento previsto contra la Fuente_Autoritativa antes de modificar el comportamiento observable de la implementación.
2. IF una corrección implicaría cambiar el comportamiento de producto observable, THEN THE Investigador SHALL registrar la justificación basada en la Fuente_Autoritativa antes de aplicar el cambio.
3. WHERE una prueba se clasifica como Deriva_de_Prueba, THE Investigador SHALL actualizar la prueba para alinearla con el comportamiento previsto en lugar de modificar la implementación.
4. THE Investigador SHALL excluir del alcance de esta investigación cualquier cambio relacionado con el bugfix `collapsed-menu-icon-centering`.

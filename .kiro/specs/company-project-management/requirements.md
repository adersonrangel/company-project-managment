# Requirements Document

## Introduction

Este documento define los requisitos para un sistema de administración de empresas y sus proyectos asociados, desarrollado en .NET 10. El sistema permite gestionar información básica de empresas (nombre, identificación, teléfono, dirección y estado de habilitación) así como los proyectos vinculados a cada empresa (nombre del proyecto, fecha de habilitación y estado de habilitación). La relación entre empresas y proyectos es de uno a muchos (1:N).

## Glossary

- **Sistema**: La aplicación .NET 10 de administración de empresas y proyectos.
- **Empresa**: Entidad que representa una organización registrada en el sistema con nombre, identificación, teléfono, dirección y estado de habilitación.
- **Proyecto**: Entidad que representa un proyecto asociado a una empresa, con nombre, fecha de habilitación y estado de habilitación.
- **Identificación**: Código único que identifica a una empresa dentro del sistema.
- **Estado_Habilitación**: Campo booleano que indica si una entidad (Empresa o Proyecto) se encuentra habilitada o deshabilitada.
- **Fecha_Habilitación**: Fecha en la que un proyecto fue habilitado.

## Requirements

### Requisito 1: Crear Empresa

**Historia de Usuario:** Como administrador, quiero registrar una nueva empresa en el sistema, para poder gestionar su información y sus proyectos asociados.

#### Criterios de Aceptación

1. WHEN el administrador envía los datos de una empresa con todos los campos obligatorios (Nombre, Identificación, Teléfono, Dirección y EstadoHabilitación) cumpliendo las reglas de validación, THE Sistema SHALL crear un nuevo registro de empresa y retornar los datos de la empresa creada incluyendo su identificador único generado.
2. IF la Identificación enviada ya existe en el sistema, THEN THE Sistema SHALL rechazar la creación y retornar un mensaje de error indicando que la identificación ya está registrada, sin modificar los datos existentes.
3. IF algún campo obligatorio está ausente o algún campo no cumple las reglas de validación, THEN THE Sistema SHALL rechazar la creación y retornar un mensaje de error indicando cada campo que falló validación y el motivo del fallo.
4. THE Sistema SHALL aplicar las siguientes reglas de validación a los campos de empresa: Nombre entre 1 y 200 caracteres, Identificación entre 1 y 50 caracteres, Teléfono entre 1 y 15 caracteres, y Dirección entre 1 y 500 caracteres.

### Requisito 2: Consultar Empresas

**Historia de Usuario:** Como administrador, quiero consultar las empresas registradas en el sistema, para poder visualizar su información.

#### Criterios de Aceptación

1. WHEN el administrador solicita la lista de empresas, THE Sistema SHALL retornar todas las empresas registradas con los campos: nombre, identificación, teléfono, dirección y estado de habilitación.
2. WHEN el administrador solicita la lista de empresas y no existen empresas registradas, THE Sistema SHALL retornar una lista vacía.
3. WHEN el administrador solicita los datos de una empresa específica por su identificación, THE Sistema SHALL retornar la información completa de la empresa incluyendo los campos: nombre, identificación, teléfono, dirección, estado de habilitación y la lista de proyectos asociados.
4. IF el administrador consulta una empresa con una identificación que no existe en el sistema, THEN THE Sistema SHALL retornar un mensaje de error indicando que la empresa no fue encontrada.

### Requisito 3: Actualizar Empresa

**Historia de Usuario:** Como administrador, quiero actualizar la información de una empresa existente, para mantener los datos actualizados.

#### Criterios de Aceptación

1. WHEN el administrador envía datos actualizados para una empresa existente, THE Sistema SHALL modificar los campos Nombre (máximo 200 caracteres), Identificación (máximo 50 caracteres), Teléfono (máximo 20 caracteres), Dirección (máximo 300 caracteres) y EstadoHabilitación del registro de la empresa, y retornar los datos actualizados de la empresa como confirmación de la operación exitosa.
2. IF el administrador intenta actualizar una empresa con una Identificación que no corresponde a ningún registro existente, THEN THE Sistema SHALL rechazar la operación y retornar un mensaje de error indicando que la empresa no fue encontrada.
3. IF el administrador envía datos de actualización con campos que incumplen las reglas de validación (Nombre vacío o mayor a 200 caracteres, Identificación vacía o mayor a 50 caracteres, Teléfono mayor a 20 caracteres, Dirección mayor a 300 caracteres), THEN THE Sistema SHALL rechazar la operación y retornar un mensaje de error indicando los campos inválidos y la razón del fallo de validación.
4. IF el administrador intenta actualizar el campo Identificación de una empresa a un valor que ya está asignado a otra empresa registrada, THEN THE Sistema SHALL rechazar la operación y retornar un mensaje de error indicando que la Identificación ya se encuentra en uso por otra empresa.

### Requisito 4: Eliminar Empresa

**Historia de Usuario:** Como administrador, quiero eliminar una empresa del sistema, para poder remover registros que ya no son necesarios.

#### Criterios de Aceptación

1. WHEN el administrador solicita eliminar una empresa existente que no tiene proyectos asociados, THE Sistema SHALL eliminar permanentemente el registro de la empresa y retornar una respuesta de confirmación indicando que la eliminación fue exitosa.
2. WHEN el administrador solicita eliminar una empresa que fue eliminada exitosamente, THE Sistema SHALL verificar que la empresa ya no es recuperable mediante consultas posteriores al sistema.
3. IF la empresa a eliminar tiene uno o más proyectos asociados, THEN THE Sistema SHALL rechazar la eliminación, preservar el registro de la empresa sin modificaciones, y retornar un mensaje de error indicando que la empresa tiene proyectos vinculados.
4. IF la identificación proporcionada no corresponde a una empresa existente en el sistema, THEN THE Sistema SHALL retornar un mensaje de error indicando que la empresa no fue encontrada.
5. IF la identificación proporcionada tiene un formato inválido, THEN THE Sistema SHALL retornar un mensaje de error indicando que el formato de identificación no es válido.

### Requisito 5: Crear Proyecto

**Historia de Usuario:** Como administrador, quiero registrar un nuevo proyecto asociado a una empresa, para poder gestionar los proyectos de cada organización.

#### Criterios de Aceptación

1. WHEN el administrador envía los datos de un proyecto con nombre (entre 1 y 200 caracteres), fecha de habilitación (fecha válida en formato ISO 8601) y estado de habilitación (valor booleano), junto con la identificación de una empresa existente, THE Sistema SHALL crear un nuevo registro de proyecto vinculado a la empresa y confirmar la operación exitosa.
2. IF la empresa referenciada en la solicitud de creación de proyecto no existe en el sistema, THEN THE Sistema SHALL rechazar la creación y retornar un mensaje de error indicando que la empresa no fue encontrada.
3. IF el administrador envía una solicitud de creación de proyecto con nombre vacío, nombre con más de 200 caracteres, fecha de habilitación ausente o con formato inválido, o estado de habilitación ausente, THEN THE Sistema SHALL rechazar la creación y retornar un mensaje de error indicando los campos faltantes o inválidos.
4. IF ya existe un proyecto con el mismo nombre asociado a la misma empresa, THEN THE Sistema SHALL rechazar la creación y retornar un mensaje de error indicando que el nombre del proyecto ya está en uso para esa empresa.

### Requisito 6: Consultar Proyectos

**Historia de Usuario:** Como administrador, quiero consultar los proyectos asociados a una empresa, para poder visualizar su información.

#### Criterios de Aceptación

1. WHEN el administrador solicita los proyectos de una empresa específica, THE Sistema SHALL retornar la lista de proyectos asociados a la empresa, donde cada proyecto incluye: nombre, fecha de habilitación y estado de habilitación. Si la empresa no tiene proyectos asociados, THE Sistema SHALL retornar una lista vacía.
2. WHEN el administrador solicita los datos de un proyecto específico, THE Sistema SHALL retornar la información del proyecto incluyendo: nombre, fecha de habilitación, estado de habilitación y la empresa a la que pertenece.
3. IF el administrador consulta los proyectos de una empresa que no existe en el sistema, THEN THE Sistema SHALL retornar un mensaje de error indicando que la empresa no fue encontrada.
4. IF el administrador solicita los datos de un proyecto que no existe en el sistema, THEN THE Sistema SHALL retornar un mensaje de error indicando que el proyecto no fue encontrado.

### Requisito 7: Actualizar Proyecto

**Historia de Usuario:** Como administrador, quiero actualizar la información de un proyecto existente, para mantener los datos actualizados.

#### Criterios de Aceptación

1. WHEN el administrador envía datos actualizados para un proyecto existente con campos válidos (Nombre: cadena de 1 a 200 caracteres; FechaHabilitación: fecha válida en formato ISO 8601; EstadoHabilitación: valor booleano), THE Sistema SHALL modificar únicamente los campos proporcionados en el registro del proyecto y retornar el registro actualizado del proyecto con todos sus campos.
2. IF el administrador intenta actualizar un proyecto cuyo identificador no existe en el sistema, THEN THE Sistema SHALL rechazar la operación y retornar un mensaje de error indicando que el proyecto no fue encontrado.
3. IF el administrador envía datos que violan las reglas de validación (Nombre vacío o mayor a 200 caracteres, FechaHabilitación con formato no válido, o EstadoHabilitación con un valor no permitido), THEN THE Sistema SHALL rechazar la operación sin modificar el registro y retornar un mensaje de error indicando los campos que fallaron la validación.
4. IF el administrador envía una solicitud de actualización sin incluir al menos un campo actualizable (Nombre, FechaHabilitación o EstadoHabilitación), THEN THE Sistema SHALL rechazar la operación y retornar un mensaje de error indicando que se requiere al menos un campo para actualizar.

### Requisito 8: Eliminar Proyecto

**Historia de Usuario:** Como administrador, quiero eliminar un proyecto del sistema, para poder remover proyectos que ya no son necesarios.

#### Criterios de Aceptación

1. WHEN el administrador solicita eliminar un proyecto existente por su identificador único dentro de una empresa, THE Sistema SHALL eliminar permanentemente el registro del proyecto de la empresa correspondiente y confirmar la operación exitosa.
2. IF el identificador del proyecto proporcionado no corresponde a un proyecto existente dentro de la empresa especificada, THEN THE Sistema SHALL retornar un mensaje de error indicando que el proyecto no fue encontrado.
3. IF el identificador de la empresa proporcionado no corresponde a una empresa existente, THEN THE Sistema SHALL retornar un mensaje de error indicando que la empresa no fue encontrada.

### Requisito 9: Relación Empresa-Proyecto

**Historia de Usuario:** Como administrador, quiero que cada proyecto esté asociado a exactamente una empresa, para mantener la integridad de los datos.

#### Criterios de Aceptación

1. THE Sistema SHALL mantener una relación de uno a muchos entre Empresa y Proyecto, donde una empresa puede tener cero o más proyectos asociados.
2. THE Sistema SHALL garantizar que cada proyecto esté asociado a exactamente una empresa.
3. WHEN se consulta una empresa, THE Sistema SHALL retornar la lista de proyectos asociados a dicha empresa, incluyendo al menos el identificador y el nombre de cada proyecto.
4. IF se intenta crear o actualizar un proyecto con un identificador de empresa nulo o que no corresponde a una empresa existente, THEN THE Sistema SHALL rechazar la operación y retornar un mensaje de error indicando que la empresa especificada es inválida o no existe.
5. IF se intenta eliminar una empresa que tiene uno o más proyectos asociados, THEN THE Sistema SHALL rechazar la eliminación y retornar un mensaje de error indicando que la empresa no puede ser eliminada mientras tenga proyectos asociados.

### Requisito 10: Validación de Campos de Empresa

**Historia de Usuario:** Como administrador, quiero que el sistema valide los datos de las empresas, para garantizar la integridad de la información.

#### Criterios de Aceptación

1. THE Sistema SHALL requerir que el campo nombre de la empresa sea obligatorio, contenga al menos 1 carácter visible después de eliminar espacios en blanco al inicio y al final, y no exceda los 200 caracteres de longitud.
2. THE Sistema SHALL requerir que el campo identificación de la empresa sea obligatorio, contenga al menos 1 carácter visible después de eliminar espacios en blanco al inicio y al final, no exceda los 50 caracteres de longitud, y sea único entre todas las empresas registradas en el sistema.
3. THE Sistema SHALL requerir que el campo teléfono de la empresa sea obligatorio, contenga al menos 1 carácter visible después de eliminar espacios en blanco al inicio y al final, contenga únicamente dígitos, el carácter +, espacios o guiones, y no exceda los 20 caracteres de longitud.
4. THE Sistema SHALL requerir que el campo dirección de la empresa sea obligatorio, contenga al menos 1 carácter visible después de eliminar espacios en blanco al inicio y al final, y no exceda los 300 caracteres de longitud.
5. WHEN se crea una nueva empresa, THE Sistema SHALL asignar el valor habilitado (true) al campo estado de habilitación si no se proporciona un valor explícito.
6. IF algún campo obligatorio no cumple las reglas de validación definidas en los criterios 1 al 4, THEN THE Sistema SHALL rechazar la solicitud e indicar mediante un mensaje de error cuáles campos son inválidos y la razón del rechazo.
7. IF se intenta registrar una empresa con un valor de identificación que ya existe en el sistema, THEN THE Sistema SHALL rechazar la solicitud e indicar mediante un mensaje de error que la identificación ya se encuentra registrada.

### Requisito 11: Validación de Campos de Proyecto

**Historia de Usuario:** Como administrador, quiero que el sistema valide los datos de los proyectos, para garantizar la integridad de la información.

#### Criterios de Aceptación

1. THE Sistema SHALL requerir que el campo nombre del proyecto sea obligatorio, contenga al menos 1 carácter que no sea espacio en blanco, y no exceda los 200 caracteres de longitud.
2. THE Sistema SHALL requerir que el campo fecha de habilitación del proyecto sea obligatorio y contenga una fecha válida en formato ISO 8601 (yyyy-MM-dd), dentro del rango comprendido entre 2000-01-01 y 2099-12-31.
3. WHEN se crea un nuevo proyecto sin especificar el campo estado de habilitación, THE Sistema SHALL asignar el valor por defecto de habilitado (true) al campo estado de habilitación.
4. IF la validación de algún campo del proyecto falla, THEN THE Sistema SHALL rechazar la solicitud y retornar un mensaje de error indicando el campo inválido y la razón del rechazo.

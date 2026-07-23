# Requirements Document

## Introduction

Este documento define los requerimientos para el Dashboard de Estadísticas en la página principal del sistema de gestión de empresas y proyectos. El Dashboard presentará información relevante mediante gráficas y tarjetas de resumen que permitan visualizar de forma rápida el estado general de las empresas y los proyectos registrados en el sistema.

## Glossary

- **Dashboard**: Página principal del sistema que muestra información consolidada mediante tarjetas de resumen y gráficas estadísticas.
- **Sistema**: La aplicación web de gestión de empresas y proyectos (frontend React + backend .NET).
- **API_Dashboard**: Endpoint del backend que provee los datos estadísticos consolidados para el Dashboard.
- **Tarjeta_Resumen**: Componente visual que muestra un indicador numérico con su etiqueta descriptiva.
- **Gráfica**: Componente visual que representa datos estadísticos de forma gráfica (barras, circular, líneas).
- **Empresa**: Entidad del sistema que representa una compañía registrada, con atributos de nombre, identificación, dirección, teléfono y estado de habilitación.
- **Proyecto**: Entidad del sistema que representa un proyecto asociado a una empresa, con atributos de nombre, fecha de habilitación y estado de habilitación.
- **Estado_Habilitacion**: Campo booleano que indica si una empresa o proyecto está habilitado (activo) o deshabilitado (inactivo).

## Requirements

### Requirement 1: Endpoint de Estadísticas del Dashboard

**User Story:** Como desarrollador frontend, quiero un endpoint API que devuelva datos estadísticos consolidados, para que el Dashboard pueda renderizar la información sin realizar múltiples llamadas al servidor.

#### Acceptance Criteria

1. WHEN el Dashboard solicita datos estadísticos mediante una petición HTTP GET, THE API_Dashboard SHALL responder con un código HTTP 200 y un cuerpo que contenga el total de empresas registradas, el total de empresas habilitadas y el total de empresas deshabilitadas.
2. WHEN el Dashboard solicita datos estadísticos, THE API_Dashboard SHALL responder con el total de proyectos registrados, el total de proyectos habilitados y el total de proyectos deshabilitados.
3. WHEN el Dashboard solicita datos estadísticos, THE API_Dashboard SHALL responder con la cantidad de proyectos agrupados por empresa, incluyendo para cada agrupación el nombre de la empresa y el conteo de proyectos asociados.
4. WHEN el Dashboard solicita datos estadísticos, THE API_Dashboard SHALL responder en un tiempo menor a 500ms para conjuntos de hasta 1000 empresas y 5000 proyectos.
5. IF el API_Dashboard no puede obtener los datos del repositorio, THEN THE API_Dashboard SHALL responder con un código HTTP 500 y un mensaje de error que indique la causa general de la falla en la obtención de datos.
6. IF no existen empresas ni proyectos registrados en el sistema, THEN THE API_Dashboard SHALL responder con un código HTTP 200 y valores en cero para todos los totales y una lista vacía para la agrupación de proyectos por empresa.

### Requirement 2: Tarjetas de Resumen

**User Story:** Como usuario, quiero ver tarjetas de resumen en el Dashboard, para que pueda conocer rápidamente el total de empresas y proyectos del sistema.

#### Acceptance Criteria

1. WHEN el Dashboard se carga, THE Sistema SHALL mostrar una Tarjeta_Resumen con el total de empresas registradas obtenido de la respuesta de la API_Dashboard.
2. WHEN el Dashboard se carga, THE Sistema SHALL mostrar una Tarjeta_Resumen con el total de proyectos registrados obtenido de la respuesta de la API_Dashboard.
3. WHEN el Dashboard se carga, THE Sistema SHALL mostrar una Tarjeta_Resumen con el total de empresas habilitadas obtenido de la respuesta de la API_Dashboard.
4. WHEN el Dashboard se carga, THE Sistema SHALL mostrar una Tarjeta_Resumen con el total de proyectos habilitados obtenido de la respuesta de la API_Dashboard.
5. THE Tarjeta_Resumen SHALL mostrar el valor como un número entero no negativo y una etiqueta descriptiva del indicador que representa.
6. WHEN el usuario navega al Dashboard, THE Sistema SHALL solicitar datos actualizados de la API_Dashboard y refrescar los valores de todas las Tarjeta_Resumen.
7. IF el valor de un indicador es cero, THEN THE Tarjeta_Resumen SHALL mostrar el valor "0" junto a su etiqueta descriptiva.

### Requirement 3: Gráfica de Estado de Empresas

**User Story:** Como usuario, quiero ver una gráfica circular del estado de habilitación de las empresas, para que pueda identificar rápidamente la proporción entre empresas activas e inactivas.

#### Acceptance Criteria

1. WHEN el Dashboard se carga, THE Sistema SHALL mostrar una Gráfica circular (donut) con exactamente dos segmentos: uno para empresas habilitadas y otro para empresas deshabilitadas, utilizando los datos obtenidos de la API_Dashboard.
2. THE Gráfica de estado de empresas SHALL mostrar la etiqueta ("Habilitadas", "Deshabilitadas") y el porcentaje de cada segmento redondeado a un decimal (por ejemplo, "75.0%").
3. WHEN el usuario posiciona el cursor sobre un segmento de la Gráfica, THE Sistema SHALL mostrar un tooltip con el nombre del segmento y la cantidad absoluta de empresas correspondiente.
4. IF el total de empresas registradas es cero, THEN THE Sistema SHALL mostrar la Gráfica de estado de empresas en estado vacío con un mensaje indicando que no hay datos disponibles.

### Requirement 4: Gráfica de Estado de Proyectos

**User Story:** Como usuario, quiero ver una gráfica circular del estado de habilitación de los proyectos, para que pueda identificar rápidamente la proporción entre proyectos activos e inactivos.

#### Acceptance Criteria

1. WHEN el Dashboard se carga y existen proyectos registrados, THE Sistema SHALL mostrar una Gráfica circular (pie/donut) con exactamente dos segmentos que representen la cantidad de proyectos habilitados y la cantidad de proyectos deshabilitados respectivamente.
2. THE Gráfica de estado de proyectos SHALL mostrar la etiqueta ("Habilitados", "Deshabilitados") y el porcentaje redondeado al entero más cercano de cada segmento.
3. WHEN el usuario posiciona el cursor sobre un segmento de la Gráfica, THE Sistema SHALL mostrar un tooltip con el nombre del segmento y la cantidad absoluta de proyectos en ese segmento.
4. IF no existen proyectos registrados en el sistema, THEN THE Sistema SHALL mostrar la Gráfica de estado de proyectos en estado vacío con un mensaje que indique que no hay datos disponibles.

### Requirement 5: Gráfica de Proyectos por Empresa

**User Story:** Como usuario, quiero ver una gráfica de barras que muestre la cantidad de proyectos por empresa, para que pueda comparar la distribución de proyectos entre las diferentes empresas.

#### Acceptance Criteria

1. WHEN el Dashboard se carga, THE Sistema SHALL mostrar una Gráfica de barras con la cantidad de proyectos asociados a cada empresa, ordenadas en forma descendente por cantidad de proyectos.
2. THE Gráfica de barras SHALL mostrar el nombre de la empresa en el eje horizontal (truncado a 20 caracteres seguido de "..." si excede dicha longitud) y la cantidad de proyectos en el eje vertical.
3. WHEN el usuario posiciona el cursor sobre una barra de la Gráfica, THE Sistema SHALL mostrar un tooltip con el nombre completo de la empresa y el número de proyectos asociados.
4. IF existen más de 10 empresas, THEN THE Sistema SHALL mostrar únicamente las 10 empresas con mayor cantidad de proyectos en la Gráfica de barras.
5. IF no existen empresas con proyectos asociados, THEN THE Sistema SHALL mostrar la Gráfica de proyectos por empresa en estado vacío con un mensaje indicando que no hay datos disponibles.

### Requirement 6: Estado de Carga y Error del Dashboard

**User Story:** Como usuario, quiero recibir retroalimentación visual mientras el Dashboard carga los datos o si ocurre un error, para que sepa que el sistema está procesando la información o que algo falló.

#### Acceptance Criteria

1. WHILE el Dashboard está obteniendo datos de la API_Dashboard, THE Sistema SHALL mostrar un indicador de carga centrado en el área de contenido del Dashboard, en lugar de las tarjetas y gráficas.
2. IF la solicitud a la API_Dashboard falla o no recibe respuesta en un máximo de 10 segundos, THEN THE Sistema SHALL ocultar el indicador de carga y mostrar un mensaje de error que indique al usuario que no se pudieron cargar las estadísticas.
3. IF la solicitud a la API_Dashboard falla, THEN THE Sistema SHALL ofrecer un botón para reintentar la carga de datos, visible junto al mensaje de error.
4. WHEN el usuario presiona el botón de reintentar, THE Sistema SHALL iniciar una nueva solicitud a la API_Dashboard y mostrar el indicador de carga mientras se obtiene la respuesta.
5. IF el usuario ha reintentado la carga 3 veces consecutivas sin éxito, THEN THE Sistema SHALL deshabilitar el botón de reintentar y mostrar un mensaje indicando que se intente de nuevo más tarde.

### Requirement 7: Diseño Responsivo del Dashboard

**User Story:** Como usuario, quiero que el Dashboard se adapte a diferentes tamaños de pantalla, para que pueda visualizar las estadísticas en dispositivos de escritorio, tableta y móvil.

#### Acceptance Criteria

1. WHILE la ventana del navegador tiene un ancho mayor o igual a 1024px, THE Sistema SHALL mostrar las gráficas del Dashboard en un layout de dos columnas.
2. WHILE la ventana del navegador tiene un ancho menor a 1024px, THE Sistema SHALL mostrar las gráficas del Dashboard en un layout de una columna.
3. WHILE la ventana del navegador tiene un ancho mayor o igual a 1024px, THE Sistema SHALL mostrar las Tarjetas_Resumen en una fila horizontal que contenga las 4 tarjetas.
4. WHILE la ventana del navegador tiene un ancho menor a 1024px, THE Sistema SHALL mostrar las Tarjetas_Resumen en un layout de 2 columnas con 2 filas.
5. THE Tarjeta_Resumen SHALL ocupar el ancho disponible de su contenedor manteniendo un ancho mínimo de 280px, de modo que su contenido numérico y etiqueta permanezcan visibles sin truncamiento.

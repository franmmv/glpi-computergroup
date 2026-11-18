# ComputerGroup para GLPI

ComputerGroup añade al listado **Activos → Ordenadores** una vista que agrupa los equipos por **ubicación** y, dentro de cada ubicación, por **estado**. Puedes alternar entre la vista agrupada y la tabla habitual desde la misma pantalla.

## Características

- Agrupa todos los resultados de la búsqueda, sin paginación, aunque las columnas Ubicación y Estado estén ocultas.
- Respeta los filtros y el orden del listado, así como los permisos y las entidades activas en GLPI.
- Muestra el número de equipos por ubicación y estado. Ambos niveles se abren plegados y se pueden desplegar por separado o todos a la vez.
- Permite elegir la vista agrupada como predeterminada en el navegador.

## Requisitos

- GLPI **12**.
- Acceso de administración de GLPI para instalar y activar el plugin.
- Permiso de lectura de **Ordenadores** para usarlo.

## Descarga e instalación

1. Descarga `computergroup-<versión>.zip` desde [Releases](https://github.com/franmmv/glpi-computergroup/releases) y descomprímelo.
2. Copia la carpeta extraída `computergroup` al directorio `plugins` de tu instalación. El archivo `setup.php` debe quedar en `plugins/computergroup/setup.php`.
3. En GLPI, abre **Configuración → Plugins**, localiza **Agrupación de ordenadores** e instálalo y actívalo.

El plugin se instala en su propio directorio y funciona en modo de solo lectura.

## Uso

1. Abre **Activos → Ordenadores**. Usa los controles habituales de GLPI para buscar y ordenar los equipos.
2. Marca la casilla con el icono de agrupación en la barra del listado.
3. Despliega una ubicación y, después, un estado para ver sus equipos. La doble flecha hacia abajo despliega todos los grupos. Cuando están abiertos, cambia a una doble flecha hacia arriba para contraerlos.
4. Desmarca la casilla para volver a la tabla paginada y utilizar las acciones masivas de GLPI.

Para que el listado se abra agrupado, entra en **Preferencias de agrupación** y marca **Usar como vista predeterminada**. Desmarca esa opción para abrirlo en modo tabla. La preferencia se guarda en el perfil del navegador para esa instalación de GLPI.

## Incidencias

Si encuentras un problema, abre una incidencia en GitHub con la versión de GLPI, la del plugin y los pasos para reproducirlo. Si adjuntas capturas, oculta los datos del inventario.

## Licencia

[GPL-3.0-or-later](LICENSE).

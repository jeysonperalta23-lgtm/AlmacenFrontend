# Parte 4. Contrato propuesto de API

[Volver al índice](../../ANALISIS_BACKEND.md)

Solo `GET /api/v1/estado` aparece actualmente en las rutas propias de negocio del backend. El resto de este documento especifica endpoints por implementar; no es una lista de servicios ya disponibles.

## 1. Convenciones

Prefijo `/api/v1`. JSON para datos, `multipart/form-data` para fotografías y respuesta binaria para descargas. Los ejemplos siguientes usan IDs simbólicos; una solicitud real enviará UUID válidos.

Permisos: **T** administrador técnico; **D** usuario autenticado con permiso documental en esa custodia; **E** permiso especial de configuración, baja, reapertura o auditoría; **M** vinculación móvil válida. Ser T no implica automáticamente D.

Lista: `data`, `meta.current_page`, `meta.per_page`, `meta.total` y `meta.last_page`. Propuesta: 25 filas por defecto, máximo 100, orden estable por fecha e ID y lista de campos de ordenación permitidos. Límites de lote y tamaños son configurables.

| HTTP | Significado |
|---|---|
| `200` | Consulta, modificación o reintento idempotente confirmado |
| `201` | Creación |
| `204` | Operación correcta sin contenido |
| `401` | No autenticado o credencial móvil inválida |
| `403` | Identidad válida sin permiso |
| `404` | Recurso no encontrado; también puede ocultar un recurso fuera de ámbito |
| `409` | Versión antigua, operación incompatible, captura o estado en conflicto |
| `419` | Sesión/CSRF vencido según el manejo de Laravel |
| `413` | Archivo o cuerpo excesivo |
| `422` | Datos inválidos |
| `429` | Límite de intentos/solicitudes |
| `500/503` | Fallo interno/servicio no disponible, sin traza ni secretos en respuesta |

## 2. Acceso y usuarios

| Método y ruta | Permiso | Entrada / resultado |
|---|---|---|
| `GET /sanctum/csrf-cookie` — fuera del prefijo | Pública | Inicializa CSRF |
| `POST /auth/login` | Pública con límite | `email`, `password`; crea sesión |
| `GET /auth/me` | Autenticado | Identidad, rol y áreas; sin secretos |
| `POST /auth/logout` | Autenticado | Invalida sesión |
| `PATCH /auth/password` | Autenticado | Actual, nueva y confirmación |
| `GET /usuarios` | T | Lista paginada |
| `POST /usuarios` | T | Cuenta y asignaciones |
| `PATCH /usuarios/{id}` | T | Nombre, rol, estado, áreas autorizadas |
| `POST /usuarios/{id}/restablecer-acceso` | T | Procedimiento de restablecimiento; invalida sesiones |

No ofrecer registro público. Recuperación por correo solo si se configura y valida el correo institucional; en caso contrario, la interfaz explica el restablecimiento por responsable técnico.

Sanctum para SPA usa cookies de sesión y CSRF. Con `fetch`, enviar cookies y el valor decodificado de `XSRF-TOKEN` en `X-XSRF-TOKEN` para las solicitudes que modifican datos; `credentials` por sí solo no agrega ese encabezado. El login se implementa en la aplicación: instalar Sanctum no crea el formulario ni su controlador. [Referencia oficial de Sanctum](https://laravel.com/framework/docs/13.x/sanctum).

## 3. Catálogos y estructura

| Método y ruta | Permiso | Función |
|---|---|---|
| `GET /areas`, `GET /tipos-documentales` | D | Opciones aplicables al ámbito del usuario |
| `POST /areas`, `PATCH /areas/{id}` | E | Alta, edición o desactivación |
| `POST /tipos-documentales`, `PATCH /tipos-documentales/{id}` | E | Administración de tipos |
| `GET /estructura?area_custodia_id=...` | D | Estantes con módulos y niveles |
| `POST /estantes`, `PATCH /estantes/{id}` | E | Configurar estante |
| `POST /estantes/{id}/modulos`, `PATCH /modulos/{id}` | E | Configurar módulo |
| `POST /modulos/{id}/niveles`, `PATCH /niveles/{id}` | E | Configurar nivel |

Usar `activo=false` para desactivación; cualquier eliminación física futura tendrá contrato y comprobación de ausencia de relaciones. El API no aceptará cambiar libremente el padre de una ubicación con contenido.

## 4. Expedientes, movimientos y etiquetas

| Método y ruta | Permiso | Entrada / resultado |
|---|---|---|
| `GET /expedientes` | D | Filtros, orden, página; lista |
| `POST /expedientes` | D | Metadatos y `nivel_id`; expediente creado |
| `GET /expedientes/{id}` | D | Detalle, ubicación, versión y conteo confirmado |
| `PATCH /expedientes/{id}` | D | Campos editables y `version`; si cambia ubicación, motivo obligatorio |
| `DELETE /expedientes/{id}` | E | `motivo`, `version`; baja lógica |
| `POST /expedientes/{id}/restaurar` | E | `motivo`, `version`, destino si corresponde |
| `GET /expedientes/{id}/movimientos` | D | Historial paginado |
| `POST /expedientes/{id}/movimientos` | D | `nivel_id`, `motivo`, `version` |
| `POST /expedientes/resolver-codigo` | D | `valor`; resolución o candidatos autorizados |
| `POST /expedientes/seleccion` | D | `ids[]`; lote para etiquetas |

Registrar rutas estáticas como `resolver-codigo` y `seleccion` de forma que no se confundan con un parámetro `{id}`. Limitar el lote de selección, por ejemplo a 200 IDs por solicitud, y recuperar por lotes si se requiere imprimir más.

**Alta:** encabezado `Idempotency-Key` generado una sola vez por intento de registro. Reintentar conserva la clave. Reusar la clave con otro cuerpo devuelve `409`; una nueva alta usa una clave nueva.

```http
POST /api/v1/expedientes
Content-Type: application/json
Accept: application/json
Idempotency-Key: <uuid-del-intento>
X-XSRF-TOKEN: <token-csrf>
```

```json
{
  "area_custodia_id": "<uuid-archivo>",
  "area_origen_id": "<uuid-abastecimiento>",
  "tipo_documental_id": "<uuid-ordenes-compra>",
  "nivel_id": "<uuid-nivel>",
  "anio_documental": 2021,
  "tomo": "II",
  "folio_desde": "001",
  "folio_hasta": "125",
  "codigo_referencia": "ABAST-OC-2021-TII",
  "observaciones": "Documentación revisada para registro."
}
```

Respuesta abreviada `201`:

```json
{
  "data": {
    "id": "<uuid-expediente>",
    "codigo": "ARC-2026-000125",
    "codigo_referencia": "ABAST-OC-2021-TII",
    "anio_documental": 2021,
    "estado_digital": "SIN_INICIAR",
    "paginas_capturadas": 0,
    "version": 1,
    "ubicacion": {
      "nivel_id": "<uuid-nivel>",
      "estante": "1",
      "modulo": "A",
      "nivel": "2"
    }
  }
}
```

Ejemplo de filtros: `GET /api/v1/expedientes?anio_documental=2021&estado_digital=PENDIENTE&page=1&per_page=25`. Se admiten además texto, custodia, origen, tipo, estante, módulo, nivel y fechas de registro, siempre dentro del ámbito autorizado.

**Validación `422`:**

```json
{
  "message": "Revisa los datos del expediente.",
  "errors": { "folio_hasta": ["Debe ser mayor o igual al folio inicial."] },
  "request_id": "<id-solicitud>"
}
```

**Conflicto `409`:**

```json
{
  "message": "El expediente fue modificado. Actualiza los datos antes de guardar.",
  "code": "VERSION_CONFLICT",
  "current_version": 4,
  "request_id": "<id-solicitud>"
}
```

**Resolución:** `{"valor":"ALMACEN:EXP:<id>"}`. Resultado `200` con `resultado="unico"` y expediente, o `resultado="ambiguo"` y candidatos cuando una referencia coincide con varios. Sin coincidencias autorizadas: `404`. Un QR malformado: `422`. No usar coincidencia parcial para resolver la identidad de una etiqueta.

## 5. Sesiones y páginas del escritorio

| Método y ruta | Permiso | Función |
|---|---|---|
| `GET /sesiones-captura` | D | Recuperar sesiones propias autorizadas |
| `POST /sesiones-captura` | D | Crear sesión en custodia |
| `GET /sesiones-captura/{id}` | D propietario | Estado y revisión |
| `GET /sesiones-captura/{id}/eventos?despues=42` | D propietario | Eventos incrementales |
| `POST /sesiones-captura/{id}/vinculaciones` | D propietario | Crear código de vinculación de un uso |
| `DELETE /sesiones-captura/{id}/vinculaciones/{vinculo}` | D propietario | Revocar dispositivo |
| `POST /sesiones-captura/{id}/activar` | D propietario | `expediente_id`, `revision`; cambia selección |
| `POST /sesiones-captura/{id}/pausar` | D propietario | `expediente_id`, `revision`; pausa |
| `POST /sesiones-captura/{id}/finalizar` | D + permiso de finalización | Expediente, revisión y versión; revisión explícita |
| `POST /sesiones-captura/{id}/cerrar` | D propietario | Cierra y revoca vínculos |
| `GET /expedientes/{id}/paginas` | D | Páginas confirmadas en orden |
| `GET /paginas/{id}/contenido`, `GET /paginas/{id}/miniatura` | D | Archivo privado tras autorizar |
| `DELETE /paginas/{id}` | D con permiso | Motivo y versión del expediente; retiro lógico |
| `PUT /expedientes/{id}/orden-paginas` | D | `pagina_ids[]`, `version`; orden completo |
| `POST /expedientes/{id}/reabrir-digitalizacion` | E | Motivo, versión y sesión destino |

Las rutas de contenido no devuelven la ruta física del servidor. Una miniatura recibe la misma protección que el original. Si se limita el tamaño de una lista de páginas, documentar paginación o una operación de orden parcial para volúmenes grandes; la primera implementación puede ordenar el conjunto completo dentro de un límite acordado.

## 6. API móvil limitada

| Método y ruta | Permiso | Contrato |
|---|---|---|
| `POST /captura/vincular` | Código de un uso + CSRF | Canjea código; establece cookie restringida |
| `GET /captura/estado` | M | Solo expediente activo, revisión, reserva y estado necesarios |
| `POST /captura/latido` | M | Actualiza última actividad |
| `POST /captura/reservas` | M | `capture_id`, `revision`; reserva |
| `DELETE /captura/reservas/{captureId}` | M | Cancela reserva propia |
| `POST /captura/paginas` | M | `photo`, `capture_id`, `revision`, mediante multipart |
| `POST /captura/lecturas` | M | `lectura_id`, `valor`, `revision`; resolución central y evento al escritorio |

El móvil no elige libremente un expediente para una carga: el servidor lo obtiene de la reserva validada. El escaneo solo puede seleccionar dentro de la custodia de la sesión y no cambia de expediente si hay una captura pendiente. Una lectura ambigua no cambia la selección.

La autenticación móvil basada en cookie requiere protección CSRF y verificación de origen en mutaciones. El canje limita intentos, consume el código en una transacción, y el frontend retira el secreto de la URL. Evitar que secretos aparezcan en registros del servidor o enlaces externos.

La respuesta de carga incluye la página confirmada, revisión y secuencia. Una repetición idéntica devuelve esa página; contenido diferente con la misma clave devuelve `409 CAPTURE_CONFLICT`. La vigencia de permisos se verifica incluso en reintentos ya confirmados.

## 7. Levantamiento, reportes y auditoría

| Método y ruta | Permiso | Función |
|---|---|---|
| `GET /jornadas-levantamiento`, `POST /jornadas-levantamiento` | D | Listar/abrir jornadas |
| `PATCH /jornadas-levantamiento/{id}` | D; E al reabrir | Metadatos, cierre o reapertura con motivo y versión |
| `GET /jornadas-levantamiento/{id}/registros` | D | Registros y subtotales por unidad |
| `POST /jornadas-levantamiento/{id}/registros` | D | Observación física |
| `PATCH /registros-levantamiento/{id}` | D | Corrección con versión |
| `DELETE /registros-levantamiento/{id}` | D con permiso | Baja en jornada abierta |
| `GET /dashboard/resumen` | D | Totales del ámbito filtrado |
| `GET /estantes/{id}/resumen` | D | Conteos por módulo y nivel |
| `GET /reportes/expedientes` | D | Reporte filtrado |
| `GET /reportes/levantamiento` | D | Unidades separadas |
| `GET /reportes/movimientos` | D | Trazabilidad por periodo |
| `GET /reportes/digitalizacion` | D | Estado y páginas confirmadas |
| `GET /auditoria` | E | Consulta paginada, sin edición |

Definir `formato=json|xlsx|csv` para los reportes que se implementen y documentar cuáles admiten cada formato. No cambiar una extensión para aparentar un XLSX: generar un libro real con una biblioteca compatible o entregar CSV correctamente identificado.

Las exportaciones grandes podrán usar `POST /exportaciones`, `GET /exportaciones/{id}` y `GET /exportaciones/{id}/descarga`. Son una extensión condicional; requieren cola y almacenamiento privado. Los permisos se comprueban al crear y descargar.

## 8. Documentación implementable

Convertir este contrato a OpenAPI al crear los controladores, incluyendo campos obligatorios, esquemas, ejemplos, estados, permisos y límites reales. Este documento no sustituye esa especificación ejecutable ni pruebas de contrato.

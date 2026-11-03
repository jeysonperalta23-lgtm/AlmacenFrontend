# Plan de ejecución del backend — ALMACEN

**Fecha:** 15 de septiembre de 2026. **Estado:** planificación basada en el código actual; las tablas y rutas descritas son trabajo por implementar.

Este documento desarrolla las instrucciones originales de este archivo: analizar el frontend y documentar aquí el diseño técnico y los pasos a seguir. Se conservan los acuerdos de [planbackend.md](../../../planbackend.md) y [pasos.md](../../../pasos.md): Laravel + MySQL, React + TypeScript, uso en red municipal, cookies de sesión y backend independiente en `C:\xampp\htdocs\ALMACEN-BACKEND`. Verificar la situación actual de esa carpeta al comenzar la instalación.

## 1. ANÁLISIS DE REQUERIMIENTOS Y ENTIDADES

### 1.1. Pantallas, flujos y situación real

| Fuente en `src/` | Funcionalidad observada | Necesidad de backend |
|---|---|---|
| `App.tsx`, `pages/Login/LoginPage.tsx` | Rutas manuales, correo, contraseña y recuperación; login solo muestra un aviso | Autenticación, sesión, permisos y recuperación de acceso |
| `pages/Inventario/LevantamientoPage.tsx`, `components/inventory/` | Alta/eliminación de lotes, orden por estante/módulo, suma de cantidades; botón Excel sin manejador | Persistencia, consultas ordenadas, agregados y XLSX |
| `components/archive/FormExpediente.tsx` | Alta/edición, código sugerido editable, ubicación, tipo, año, tomo, observaciones y datos de Abastecimiento | Validación servidor, ID estable, códigos concurrentes y catálogos |
| `pages/Archivo/ArchivoCentral.tsx` | Últimos registros, detalle, eliminación individual y vaciado general | CRUD autorizado, historial y operaciones masivas controladas |
| `components/archive/ConfigEstantes.tsx` | Añadir estantes numerados y añadir/quitar módulos | Estructura persistente y protección de ubicaciones ocupadas |
| `components/archive/DashboardInicio.tsx` | Totales, altas del mes, estante más ocupado, áreas/años destacados, recientes y capacidad | Agregados globales, independientes de la página de resultados cargada |
| `components/archive/MapaEstantes.tsx` | Navegación por estante/nivel, búsqueda, expediente seleccionado y fotografías | Árbol físico, filtros por ubicación y páginas privadas |
| `components/archive/EtiquetadoArchivo.tsx` | Buscar código/tipo/módulo/año, filtrar estante, ocho filas por página y seleccionar etiquetas | Búsqueda/paginación en servidor y consulta por IDs seleccionados |
| `DetalleExpediente.tsx`, `ImprimirEtiquetas.tsx`, `CodigoEtiqueta.tsx` en `components/archive/` | Detalle, historial, QR, barras e impresión A4/sticker | Datos consistentes y QR estable; impresión puede seguir en React |
| `BuscadorEscaner.tsx`, `EscanerExpediente.tsx`, `hooks/useMobileScanBridge.ts` | Buscar QR/código y enviar lectura del móvil al escritorio | Resolver contra MySQL y sincronizar lecturas autorizadas |
| `components/archive/Digitalizacion.tsx`, `pages/Archivo/CapturaMovil.tsx` | Vincular, confirmar expediente, reservar foto, enviar/reintentar, ordenar/eliminar, pausar/finalizar/cerrar | Sesiones persistentes, concurrencia y almacenamiento privado |
| `components/archive/RevisionArchivo.tsx`, `utils/archiveAlerts.ts` | Imágenes faltantes, datos incompletos, ubicaciones inválidas, posibles duplicados y estado revisado | Consultas de calidad; el componente de revisión no está montado actualmente en ArchivoCentral |
| `Notice`, `Capacity`, `ArchiveOperations` | Tipos para avisos, capacidades y estados operativos | Capacidad utilizada en dashboard; gestión de avisos y revisión como ampliación con integración de UI pendiente |

**Persistencia actual:**

- `services/archiveMemory.ts` y `hooks/useMemoryState.ts` mantienen expedientes y estructura en memoria. Levantamiento usa `useState`. Recargar reinicia los registros.
- `services/digitalizacionMemory.ts` conserva en memoria el índice de imágenes, credenciales y orden de páginas. El orden no se guarda en PHP.
- Ya existe `api/demo.php`: receptor de demostración con sesiones JSON e imágenes en carpeta temporal, sin MySQL ni usuarios autenticados. No se parte de cero en el flujo de captura, pero sí falta el backend documental persistente.
- El pie de ArchivoCentral promete persistencia entre sesiones, contradiciendo el almacenamiento real. Corregirlo al integrar la API.
- Los textos del login sobre productos y existencias no corresponden a formularios de ventas/compras: el dominio implementado es archivo documental y levantamiento físico.

### 1.2. Entidades y atributos funcionales

| Entidad | Atributos necesarios |
|---|---|
| Usuario | ID, nombre, correo, hash de contraseña, rol, activo y áreas autorizadas |
| Entidad municipal | Nombre institucional y jurisdicción sugerida; actualmente Municipalidad de Pampas de Hospital / Tumbes |
| Área | Nombre, entidad; distinguir custodia del archivo y origen del documento |
| Estante | Número visible, custodia, activo, capacidad en plazas de expediente y umbral porcentual |
| Módulo | Estante, nombre, área sugerida, regla de campos de Abastecimiento y activo |
| Nivel | Módulo, etiqueta de bandeja y orden; la UI acepta texto, no solo números |
| Tipo documental | Nombre y activo; los datalist actuales son sugerencias y admiten texto libre |
| Expediente | ID, código, ubicación, tipo, año, tomo, observaciones, entidad, área, jurisdicción, folios, fecha, estado digital, páginas y sesión asociada |
| Movimiento de ubicación | Expediente, fecha, ubicación anterior opcional y nueva; añadir actor y motivo |
| Registro físico | Estante/módulo observados, área, tipo documental, año, cantidad, unidad y notas |
| Sesión de captura | Propietario, expediente activo, estado, revisión de selección, secuencia, última conexión y vencimiento |
| Vínculo móvil | Sesión, invitación temporal, dispositivo autorizado, credencial restringida y revocación |
| Reserva de captura | ID idempotente, sesión, expediente/revisión fijados, vencimiento y estado |
| Página digital | Expediente, sesión, archivo, MIME, bytes, dimensiones, orden, checksum, fecha y autor |
| Lectura de etiqueta | ID, sesión, valor, pendiente/aceptada/rechazada, mensaje y expediente resuelto |
| Aviso operativo — ampliación | Título, contenido, autor, tipo, prioridad, estante opcional, publicación, inicio/fin, actividad, enlace y archivado |
| Seguimiento personal — ampliación | Usuario, expediente, aviso nuevo en Explorar y pendiente de revisar |
| Auditoría — soporte | Actor, acción, recurso, cambios, fecha y correlación de solicitud |

No persistir modal, toast, zoom, pestaña, progreso de formulario ni selección temporal de impresión. El QR se deriva del ID y no necesita una tabla de imágenes de etiquetas.

### 1.3. Reglas de negocio y decisiones pendientes

1. **Custodia:** confirmar Abastecimiento como área operadora o Archivo Central custodiando varias áreas. Proponer una custodia inicial y `usuario_area` para autorizaciones.
2. **Código:** el generador actual puede repetir códigos y el escáner contempla ambigüedad. Proponer código de registro único por custodia con correlativo y `codigo_referencia` repetible para conservar códigos antiguos. Aprobar nomenclatura antes de migrar; no renombrar etiquetas automáticamente.
3. **Año:** Archivo exige 1980–año actual; Levantamiento no fija ese rango y los textos históricos mencionan años anteriores. Confirmar política de archivo histórico; no inferirla de textos decorativos.
4. **Folios:** ambos vacíos o ambos enteros positivos, final ≥ inicial. No equiparar folios con cantidad de fotografías. Conservar ceros iniciales como formato si se requiere.
5. **Tomo:** texto opcional en mayúsculas; conversión de números 1–3999 a romano compatible con UI.
6. **Ubicación:** nivel pertenece a módulo y módulo a estante. No eliminar módulos ocupados. Mover no cambia el área de origen.
7. **Abastecimiento:** reemplazar la expresión regular del nombre del módulo por configuración explícita; exigir área válida y jurisdicción cuando corresponda.
8. **Estado digital:** API única con `PENDIENTE`, `EN_PROCESO`, `FINALIZADO`, compatible con tipos actuales. PENDIENTE incluye sin iniciar y pausado. El plan previo propone también SIN_INICIAR: incorporarlo solo si se aprueba, ampliando frontend y pruebas conjuntamente.
9. **Finalizar:** proponer al menos una página disponible y revisión del encargado. Modificar páginas finalizadas requiere reapertura. Pausar/cambiar/cerrar exige resolver la reserva pendiente.
10. **Eliminación:** proponer baja lógica individual y restauración. El vaciado general necesita permiso y política explícitos; no trasladar `setArchivos([])` a borrado indiscriminado de SQL.

## 2. DISEÑO DE BASE DE DATOS (RELACIONAL)

### 2.1. Motor y convenciones

Objetivo propuesto: MySQL 8.4 LTS, InnoDB, `utf8mb4`, migraciones Laravel, FKs y transacciones. Comprobar versión real; MariaDB de XAMPP no equivale a un servidor MySQL confirmado.

En las tablas siguientes: **ID** = `CHAR(36)` UUID generado por servidor, PK; **FK** del mismo tipo que su referencia; **?** permite NULL. Añadir `created_at`, `updated_at DATETIME(6)` a tablas funcionales salvo pivotes con fechas indicadas. Fechas/hora en UTC; fechas civiles de avisos en DATE interpretadas con `America/Lima`. `version` = `INT UNSIGNED DEFAULT 1`. `deleted_at DATETIME(6)?` solo donde se indique.

### 2.2. Identidad y catálogos

| Tabla | Campos y claves |
|---|---|
| `entidades` | `id ID`, `nombre VARCHAR(180)`, `jurisdiccion_default VARCHAR(150)?`, `zona_horaria VARCHAR(64)` |
| `areas` | `id ID`, `entidad_id FK entidades`, `nombre VARCHAR(150)`, `nombre_normalizado VARCHAR(150)`, `activa BOOLEAN`; UNIQUE(entidad_id,nombre_normalizado) |
| `users` | `id ID`, `name VARCHAR(150)`, `email VARCHAR(254) UNIQUE` normalizado, `password VARCHAR(255)`, `rol VARCHAR(24)` ADMINISTRADOR/ENCARGADO, `activo BOOLEAN`, `remember_token VARCHAR(100)?` |
| `usuario_area` | `usuario_id FK users`, `area_id FK areas`, PK compuesta(usuario_id,area_id), `created_at DATETIME(6)` |
| `estantes` | `id ID`, `area_custodia_id FK areas`, `numero INT UNSIGNED`, `activo BOOLEAN`, `capacidad_total INT UNSIGNED?`, `umbral_porcentaje TINYINT UNSIGNED DEFAULT 80`, `version`; UNIQUE(area_custodia_id,numero) |
| `modulos` | `id ID`, `estante_id FK estantes`, `nombre VARCHAR(150)`, `nombre_normalizado VARCHAR(150)`, `area_origen_sugerida_id FK areas?`, `requiere_datos_abastecimiento BOOLEAN`, `activo BOOLEAN`, `version`; UNIQUE(estante_id,nombre_normalizado) |
| `niveles` | `id ID`, `modulo_id FK modulos`, `etiqueta VARCHAR(40)`, `orden INT UNSIGNED`, `activo BOOLEAN`, `version`; UNIQUE(modulo_id,etiqueta) |
| `tipos_documentales` | `id ID`, `entidad_id FK entidades`, `nombre VARCHAR(150)`, `nombre_normalizado VARCHAR(150)`, `activo BOOLEAN`; UNIQUE(entidad_id,nombre_normalizado) |
| `correlativos` | `area_custodia_id FK areas`, `anio SMALLINT UNSIGNED`, `ultimo BIGINT UNSIGNED`, PK compuesta(area_custodia_id,anio), `updated_at DATETIME(6)` |

Infraestructura Laravel: `sessions` con PK de sesión, user_id CHAR(36) indexado, IP, user agent, payload y última actividad; `password_reset_tokens` con email PK, hash de token y fecha. Adaptar el ID de usuario a UUID. Si se usan drivers database, añadir migraciones estándar `jobs`, `failed_jobs`, `job_batches`, `cache`, `cache_locks`; no son recursos públicos API.

### 2.3. Documentos y levantamiento

| Tabla | Campos y claves |
|---|---|
| `expedientes` | `id ID`, `area_custodia_id FK areas`, `area_origen_id FK areas?`, `nivel_id FK niveles`, `tipo_documental_id FK tipos_documentales`, `codigo VARCHAR(100)`, `codigo_normalizado VARCHAR(100)`, `codigo_referencia VARCHAR(150)?`, `referencia_normalizada VARCHAR(150)?`, `anio SMALLINT UNSIGNED`, `tomo VARCHAR(40)?`, `observaciones TEXT?`, `jurisdiccion VARCHAR(150)?`, `folio_desde INT UNSIGNED?`, `folio_hasta INT UNSIGNED?`, `folio_ancho TINYINT UNSIGNED?`, `fecha_registro DATE`, `estado_digital VARCHAR(20) DEFAULT 'PENDIENTE'`, `finalizado_at DATETIME(6)?`, `finalizado_por FK users?`, `creado_por FK users`, `actualizado_por FK users`, `version`, `deleted_at`; UNIQUE(area_custodia_id,codigo_normalizado) |
| `movimientos_ubicacion` | `id ID`, `expediente_id FK expedientes`, `nivel_anterior_id FK niveles?`, `nivel_nuevo_id FK niveles`, `anterior_snapshot JSON?`, `nueva_snapshot JSON`, `usuario_id FK users`, `motivo VARCHAR(500)?`, `ocurrido_at DATETIME(6)` |
| `registros_fisicos` | `id ID`, `area_custodia_id FK areas`, `estante_observado INT UNSIGNED`, `modulo_observado VARCHAR(150)`, `area_observada VARCHAR(150)`, `tipo_documento VARCHAR(150)`, `anio SMALLINT UNSIGNED`, `cantidad INT UNSIGNED`, `unidad VARCHAR(12)` Caja/Tomo/Carpeta/Paquete, `notas_adicionales TEXT?`, `creado_por FK users`, `version`, `deleted_at` |

Estante/módulo del expediente se derivan por nivel; no almacenar tres FKs independientes susceptibles de contradecirse. Verificar que la custodia del expediente coincida con la del estante. Entidad se deriva de custodia; API devuelve los nombres necesarios para etiquetas.

Levantamiento es una observación previa a organizar el archivo: conserva valores libres sin exigir ubicaciones catalogadas. No crear automáticamente un expediente por caja. Movimientos conservan snapshots de nombres para no reescribir el pasado cuando se renombre una ubicación. El primer movimiento tiene origen nulo.

### 2.4. Captura, operaciones y auditoría

| Tabla | Campos y claves |
|---|---|
| `sesiones_captura` | `id ID`, `propietario_id FK users`, `area_custodia_id FK areas`, `expediente_activo_id FK expedientes?`, `estado VARCHAR(12)` ABIERTA/CERRADA/EXPIRADA, `revision BIGINT UNSIGNED DEFAULT 0`, `sequence BIGINT UNSIGNED DEFAULT 0`, `last_seen_at DATETIME(6)?`, `expires_at DATETIME(6)`, `closed_at DATETIME(6)?`, `version` |
| `vinculaciones_moviles` | `id ID`, `sesion_id FK sesiones_captura`, `invitacion_hash CHAR(64) UNIQUE`, `invitacion_expires_at DATETIME(6)`, `canjeada_at DATETIME(6)?`, `token_hash CHAR(64)? UNIQUE`, `token_expires_at DATETIME(6)?`, `revoked_at DATETIME(6)?`, `last_seen_at DATETIME(6)?` |
| `bloqueos_digitalizacion` | `expediente_id FK expedientes` PK, `sesion_id FK sesiones_captura`, `expires_at DATETIME(6)`; impide captura simultánea del mismo expediente |
| `reservas_captura` | `id CHAR(32)` PK compatible con `captureId()`, `sesion_id FK sesiones_captura`, `vinculacion_id FK vinculaciones_moviles`, `expediente_id FK expedientes`, `revision BIGINT UNSIGNED`, `estado VARCHAR(12)` PENDIENTE/RECIBIDA/CANCELADA/EXPIRADA, `expires_at DATETIME(6)`, `request_hash CHAR(64)?` |
| `paginas_digitales` | `id ID`, `captura_id FK reservas_captura UNIQUE`, `expediente_id FK expedientes`, `sesion_id FK sesiones_captura`, `storage_key VARCHAR(500) UNIQUE`, `mime VARCHAR(50)`, `bytes BIGINT UNSIGNED`, `ancho INT UNSIGNED`, `alto INT UNSIGNED`, `sha256 CHAR(64)`, `orden INT UNSIGNED`, `estado_archivo VARCHAR(12)` PENDIENTE/DISPONIBLE/FALLIDO, `capturada_at DATETIME(6)`, `creado_por FK users`, `version`, `deleted_at`; UNIQUE(expediente_id,orden) |
| `lecturas_etiqueta` | `id CHAR(32)` PK, `sesion_id FK sesiones_captura`, `valor VARCHAR(1024)`, `estado VARCHAR(12)` PENDIENTE/ACEPTADA/RECHAZADA, `mensaje VARCHAR(250)?`, `expediente_id FK expedientes?`, `resuelta_at DATETIME(6)?`, `expires_at DATETIME(6)` |
| `avisos` — ampliación | `id ID`, `area_custodia_id FK areas`, `estante_id FK estantes?`, `autor_id FK users`, `titulo VARCHAR(180)`, `contenido TEXT`, `tipo VARCHAR(40)` Comunicado/Mantenimiento/Campaña de digitalización, `prioridad VARCHAR(10)` Normal/Alta, `publicado_at DATETIME(6)`, `inicio DATE`, `fin DATE`, `actividad VARCHAR(250)?`, `enlace VARCHAR(2048)?`, `archivado BOOLEAN`, `version` |
| `seguimientos_expediente` — ampliación | `usuario_id FK users`, `expediente_id FK expedientes`, PK compuesta(usuario_id,expediente_id), `explorado_at DATETIME(6)?`, `revisado_at DATETIME(6)?`, `created_at DATETIME(6)` |
| `auditoria` | `id ID`, `actor_id FK users?`, `area_custodia_id FK areas?`, `accion VARCHAR(80)`, `recurso_tipo VARCHAR(80)`, `recurso_id VARCHAR(64)?`, `antes JSON?`, `despues JSON?`, `request_id CHAR(36)`, `ip VARCHAR(45)?`, `ocurrido_at DATETIME(6)`; recurso polimórfico sin FK genérica |

Crear primero catálogos/expedientes, después sesiones y finalmente reservas/páginas. La página identifica como autor al propietario responsable y la reserva identifica el dispositivo real. El total de páginas se calcula sobre disponibles/no eliminadas; última sesión se obtiene por relación, evitando contadores redundantes sin control transaccional.

### 2.5. Relaciones, integridad e índices

```text
Entidad 1 ── N Área
Usuario N ── M Área                    [usuario_area]
Área custodia 1 ── N Estante 1 ── N Módulo 1 ── N Nivel
Nivel 1 ── N Expediente N ── 1 Tipo documental
Área origen 1 ── N Expediente
Expediente 1 ── N Movimiento / Página
Usuario 1 ── N Sesión 1 ── N Vinculación / Reserva / Lectura
Expediente N ── M Sesión               [reservas/páginas]
Reserva 1 ── 0..1 Página
Expediente 1 ── 0..1 Bloqueo activo
Área 1 ── N Registro físico / Aviso
Usuario N ── M Expediente              [seguimientos]
```

- CHECK: cantidad y número de estante positivos; capacidad nula o positiva; umbral 1–100; folios ambos nulos o válidos; inicio ≤ fin; valores enumerados permitidos. Máximo dinámico del año se valida en aplicación.
- Normalizar trim/mayúsculas de códigos de forma documentada. Elegir collation de sus columnas acorde con la comparación de acentos deseada; no cambiar silenciosamente la semántica del escáner actual.
- ON DELETE RESTRICT para documentos, ubicaciones y autorías. Desactivar catálogos/usuarios; CASCADE solo para pivotes técnicos apropiados. Baja lógica no libera códigos ni borra movimientos.
- Expedientes: índices `(area_custodia_id,deleted_at,created_at,id)`, `(area_custodia_id,anio)`, `(area_custodia_id,estado_digital)`, `(nivel_id,deleted_at)`, `(area_custodia_id,referencia_normalizada)`.
- Movimientos: `(expediente_id,ocurrido_at,id)`. Páginas: `(expediente_id,deleted_at,estado_archivo,orden)` y `(sesion_id,created_at)`.
- Registros físicos: `(area_custodia_id,deleted_at,estante_observado,modulo_observado)`; subtotales por unidad para no equiparar cajas y tomos.
- Sesiones: `(propietario_id,estado,updated_at)`, `(estado,expires_at)`; reservas: `(sesion_id,estado,expires_at)`; lecturas: `(sesion_id,estado,created_at)`.
- Avisos: `(area_custodia_id,archivado,inicio,fin)`; auditoría: `(recurso_tipo,recurso_id,ocurrido_at)` y `(actor_id,ocurrido_at)`.
- Primera búsqueda parametrizada con joins. `LIKE '%texto%'` no se optimiza como prefijo con B-tree; medir EXPLAIN y considerar FULLTEXT si el volumen lo exige, definiendo diferencias respecto a la coincidencia parcial actual.
- Dashboard por agregados, revisiones con EXISTS y relaciones precargadas para evitar N+1; nunca descargar todo el archivo para calcular una tarjeta.

## 3. ARQUITECTURA DE ENDPOINTS / RUTAS API

### 3.1. Contrato común

Prefijo `/api/v1`, salvo `/sanctum/csrf-cookie`. JSON UTF-8, API en snake_case, UUID string y fechas ISO 8601 UTC. Adaptador TypeScript transforma a `obs`, `folioDesde`, `estadoDigital`, etc. durante la transición.

- Individual: `{data:{...}}`; listado: `{data:[],meta:{page:1,per_page:8,total:0,last_page:1}}`.
- Error: `{message,code,errors:{campo:[mensaje]},request_id}`.
- Estados: 200 consulta/actualización, 201 creación, 202 trabajo, 204 sin cuerpo, 401 sin sesión, 403 sin permiso, 404 inexistente/no visible, 409 conflicto, 419 CSRF, 422 validación, 413 tamaño, 415 formato, 429 límites.
- Listas con `page`, `per_page` 1–100, `sort` de lista blanca y ID como desempate. Etiquetas: ocho filas por defecto.
- Mutaciones editables reciben `version`; comparar/incrementar atómicamente. 409 STALE_VERSION indica que debe recargarse sin perder el formulario.
- Idempotency-Key en altas/trabajos: guardar por usuario+ruta+clave el hash de payload y respuesta en caché persistente con TTL documentado. Repetición idéntica devuelve resultado; payload distinto produce 409. Capturas usan ID de reserva persistente.
- Acceso: **P** público con límites; **U** usuario activo con área autorizada; **E** permiso documental de escritura; **A** administración técnica; **M** credencial móvil restringida. A no implica automáticamente acceso a documentos.

Todas las rutas de las tablas siguientes llevan `/api/v1`, excepto la ruta CSRF indicada expresamente. Respuestas JSON usan el envoltorio común.

### 3.2. Autenticación y usuarios

| HTTP | Ruta | Acción / acceso | Payload o query | Respuesta |
|---|---|---|---|---|
| GET | `/sanctum/csrf-cookie` (sin prefijo) | Preparar CSRF / P | — | 204 y cookies |
| POST | `/auth/login` | Autenticar / P + CSRF | `{email,password}` | Usuario, áreas, permisos y cookie de sesión |
| GET | `/auth/me` | Recuperar sesión / U | — | Usuario, áreas y permisos |
| POST | `/auth/logout` | Invalidar sesión / U | — | 204 |
| PUT | `/auth/password` | Cambiar contraseña / U | `{current_password,password,password_confirmation}` | 204 |
| POST | `/auth/forgot-password` | Recuperar si SMTP habilitado / P | `{email}` | 202 mensaje genérico |
| POST | `/auth/reset-password` | Aplicar recuperación / P | `{email,token,password,password_confirmation}` | 204 |
| GET | `/users` | Listar / A | `q,activo,page,per_page` | Lista sin secretos |
| POST | `/users` | Crear / A | `{name,email,password,rol,area_ids}` | 201 usuario |
| PATCH | `/users/{id}` | Editar/desactivar/asignar áreas / A | `{name?,email?,rol?,activo?,area_ids?}` | Usuario |
| POST | `/users/{id}/reset-password` | Restablecimiento administrativo / A | `{password,password_confirmation}` | 204 e invalidación de sesiones |
| GET | `/health` | Disponibilidad / P | — | `{status:"ok"}`, sin configuración interna |

La administración de cuentas y las pantallas de recuperación requieren UI adicional; no están completas actualmente.

### 3.3. Catálogos y estructura

| HTTP | Ruta | Acción / acceso | Payload o query | Respuesta |
|---|---|---|---|---|
| GET | `/catalogos` | Formulario / U | `area_custodia_id` | Entidad, áreas, tipos, unidades y reglas |
| POST | `/areas` | Crear / A | `{entidad_id,nombre}` | 201 área |
| PATCH | `/areas/{id}` | Editar/desactivar / A | `{nombre?,activa?}` | Área |
| POST | `/tipos-documentales` | Añadir sugerencia / E | `{nombre,entidad_id}` | 201 tipo |
| PATCH | `/tipos-documentales/{id}` | Editar/desactivar / E | `{nombre?,activo?}` | Tipo |
| GET | `/estructura` | Árbol físico / U | `area_custodia_id` | Estantes, módulos, niveles, IDs y reglas |
| POST | `/estantes` | Añadir número concurrente / E | `{area_custodia_id}` | 201 estante |
| PATCH | `/estantes/{id}` | Configurar / E | `{activo?,version}` | Estante |
| PUT | `/estantes/{id}/capacidad` | Configurar ocupación / E | `{capacidad_total,umbral_porcentaje,version}` | Capacidad y ocupación |
| POST | `/estantes/{id}/modulos` | Añadir módulo / E | `{nombre,area_origen_sugerida_id?,requiere_datos_abastecimiento?}` | 201 módulo |
| PATCH | `/modulos/{id}` | Renombrar/configurar / E | `{nombre?,activo?,area_origen_sugerida_id?,requiere_datos_abastecimiento?,version}` | Módulo |
| DELETE | `/modulos/{id}` | Retirar módulo vacío / E | `{version}` | 204; 409 ocupado; desactivar para conservar historia |
| POST | `/modulos/{id}/niveles` | Crear bandeja / E | `{etiqueta,orden}` | 201 nivel |
| PATCH | `/niveles/{id}` | Editar/desactivar / E | `{etiqueta?,orden?,activo?,version}` | Nivel |

Para mantener tipo/nivel libres, el formulario puede crear previamente el tipo o nivel con sus permisos y manejar duplicados concurrentes. Levantamiento no exige estos catálogos. Numerar estantes bajo bloqueo de la custodia e índice único, no MAX+1 sin protección.

### 3.4. Expedientes, dashboard y etiquetas

`ExpedienteInput` = `{area_custodia_id,nivel_id,tipo_documental_id,anio,tomo?,observaciones?,area_origen_id?,jurisdiccion?,folio_desde?,folio_hasta?,folio_ancho?,codigo_referencia?,codigo_manual?}`. Código manual solo con permiso; sin él se genera en servidor.

| HTTP | Ruta | Acción / acceso | Payload o query | Respuesta |
|---|---|---|---|---|
| GET | `/expedientes` | Buscar/paginar / U | `q,area_custodia_id,estante_id,modulo_id,nivel_id,anio,tipo_documental_id,estado_digital,revision,page,per_page,sort` | Lista con ubicación y total de páginas |
| POST | `/expedientes` | Registrar / E | ExpedienteInput + Idempotency-Key | 201 expediente y qr_payload |
| GET | `/expedientes/{id}` | Detalle / U | — | Datos, ubicación, estado, páginas y versión |
| PATCH | `/expedientes/{id}` | Editar / E | Campos modificados + version | Expediente; crea movimiento si cambia nivel |
| DELETE | `/expedientes/{id}` | Baja lógica / E | `{version,motivo}` | 204; 409 con captura pendiente |
| POST | `/expedientes/{id}/restaurar` | Restaurar / E | `{version}` | Expediente |
| GET | `/expedientes/{id}/movimientos` | Historial / U | `page,per_page` | Lista por fecha |
| POST | `/expedientes/{id}/movimientos` | Reubicar / E | `{nivel_id,motivo,version}` | 201 movimiento y expediente |
| POST | `/expedientes/resolver-etiqueta` | Resolver QR/código / U | `{valor,area_custodia_id?}` | Coincidencia; 404 ninguna; 409 candidatos autorizados si ambiguo |
| POST | `/etiquetas/datos` | Preparar impresión / U | `{expediente_ids:[...]}` máximo 200 | Etiquetas y qr_payload, en orden solicitado |
| GET | `/dashboard` | Agregados / U | `area_custodia_id` | Totales, altas del mes, distribución, seis recientes, capacidades |
| GET | `/mapa` | Árbol/conteos / U | `area_custodia_id,estante_id?,q?` | Agrupación; detalles paginados por /expedientes |
| GET | `/revision/resumen` | Calidad / U | `area_custodia_id,estante_id?` | Conteos de imágenes/datos/ubicación/duplicados |
| POST | `/expedientes/seguimientos` | Avisos personales — ampliación / U | `{expediente_ids,accion:"explorado" o "revisado"}` | 204 |
| POST | `/administracion/vaciados` | Vaciado sujeto a aprobación / A + permiso documental | `{area_custodia_id,motivo,confirmacion}` + Idempotency-Key | 202 trabajo; conflicto con capturas abiertas |
| GET | `/trabajos/{id}` | Trabajo propio/autorizado / U | — | Estado, progreso, afectados y errores |

`revision` acepta imagenes/datos/ubicacion/duplicados. Con códigos nuevos únicos, duplicados se agrupan por referencia normalizada heredada. Incompletos/ubicación inválida sirven principalmente para diagnosticar importaciones: altas ordinarias inválidas se rechazan.

Recientes: `created_at DESC,id DESC`, no replicar `reverse()` del dashboard actual. Capacidad medida en plazas de expediente, no cajas/fotos; porcentaje puede superar 100 %, sin bloquear altas por defecto. Estadísticas usan todos los registros autorizados, no solo ocho visibles.

Mantener QR `ALMACEN:EXP:<encodeURIComponent(id)>`; barras solo para ASCII imprimible de 1–24 caracteres como actualmente. A4/sticker y copias siguen en React. Abrir `window.print()` no confirma impresión física ni debe marcar automáticamente una etiqueta como impresa.

### 3.5. Levantamiento, avisos y auditoría

| HTTP | Ruta | Acción / acceso | Payload o query | Respuesta |
|---|---|---|---|---|
| GET | `/registros-fisicos` | Listar / U | `area_custodia_id,q?,estante?,modulo?,anio?,page,per_page` | Lista, cantidad global y subtotales por unidad |
| POST | `/registros-fisicos` | Registrar lote / E | `{area_custodia_id,estante_observado,modulo_observado,area_observada,tipo_documento,anio,cantidad,unidad,notas_adicionales?}` | 201 registro |
| PATCH | `/registros-fisicos/{id}` | Corrección futura / E | Campos modificados + version | Registro |
| DELETE | `/registros-fisicos/{id}` | Baja lógica / E | `{version}` | 204 |
| GET | `/registros-fisicos/exportacion` | Excel / U + exportar | Mismos filtros, `format=xlsx` | XLSX de todos los resultados filtrados |
| GET | `/avisos` | Consultar — ampliación / U | `area_custodia_id,estado,estante_id?,page,per_page` | Vigentes/programados/historial |
| POST | `/avisos` | Publicar — ampliación / E | `{area_custodia_id,titulo,contenido,tipo,prioridad,estante_id?,inicio,fin,actividad?,enlace?}` | 201 aviso; autor/publicación asignados por servidor |
| PATCH | `/avisos/{id}` | Editar/archivar — ampliación / E | Campos modificados, archivado?, version | Aviso |
| GET | `/auditoria` | Trazabilidad / permiso auditoría | `area_custodia_id,recurso_tipo?,recurso_id?,desde?,hasta?,page,per_page` | Lista sin secretos |
| GET | `/trabajos/{id}/archivo` | Exportación grande / U | — | Archivo privado con expiración |

Aviso vigente: inicio ≤ hoy ≤ fin y no archivado; programado: inicio > hoy y no archivado; historial: archivado o fin < hoy. Exportaciones grandes pueden devolver 202 con trabajo; comprobar permisos nuevamente al descargar.

### 3.6. Sesiones y digitalización

`SesionDTO`: id, estado, expediente activo mínimo, revisión, sequence, reserva pendiente, last_seen y expires_at. Nunca incluye hashes ni claves de propietario. Galería completa se pagina aparte.

| HTTP | Ruta | Acción / acceso | Payload o query | Respuesta |
|---|---|---|---|---|
| GET | `/capturas/sesiones` | Recuperar sesiones propias / E | `estado?,expediente_id?` | Lista sin credenciales |
| POST | `/capturas/sesiones` | Crear / E | `{area_custodia_id,expediente_id?}` | 201 SesionDTO |
| GET | `/capturas/sesiones/{id}` | Estado / propietario E o M | `since_sequence?` | SesionDTO limitado al alcance |
| POST | `/capturas/sesiones/{id}/invitaciones` | QR de vínculo / propietario E | — | 201 URL, invitación de un uso y vencimiento |
| POST | `/capturas/vincular` | Canjear invitación / P con secreto válido | `{invitacion}` | Sesión mínima y cookie móvil restringida |
| DELETE | `/capturas/sesiones/{id}/vinculaciones/{vinculo}` | Revocar / propietario E | — | 204 |
| POST | `/capturas/sesiones/{id}/heartbeat` | Presencia / M | — | Última conexión |
| POST | `/capturas/sesiones/{id}/activar` | Seleccionar/reanudar / propietario E | `{expediente_id,revision}` | SesionDTO |
| POST | `/capturas/sesiones/{id}/pausar` | Pausar / propietario E | `{expediente_id,revision}` | SesionDTO |
| POST | `/capturas/sesiones/{id}/finalizar` | Finalizar / propietario E | `{expediente_id,revision,version_expediente}` | SesionDTO y expediente FINALIZADO |
| POST | `/capturas/sesiones/{id}/cerrar` | Cerrar vínculo / propietario E | `{revision}` | Sesión cerrada, vínculos revocados |
| POST | `/expedientes/{id}/reabrir-digitalizacion` | Reabrir / E | `{version,motivo}` | Expediente PENDIENTE |
| POST | `/capturas/sesiones/{id}/reservas` | Reservar foto / M | `{capture_id,revision}` | 201 reserva con expediente fijado |
| DELETE | `/capturas/sesiones/{id}/reservas/{capture}` | Descartar / M del mismo vínculo | — | 204 idempotente |
| POST | `/capturas/sesiones/{id}/paginas` | Subir/reintentar / M | multipart `{capture_id,revision,photo}` | 201 página; 200 si ya recibida idéntica |
| GET | `/expedientes/{id}/paginas` | Galería / U | `page,per_page` | ID, orden, fecha y URL privada |
| GET | `/paginas/{id}/imagen` | Imagen privada / U | `variant=original o thumbnail` | Bytes autorizados |
| PUT | `/expedientes/{id}/paginas/orden` | Reordenar / E | `{pagina_ids:[...],version_expediente}` | Orden y nueva versión |
| DELETE | `/paginas/{id}` | Retirar / E | `{version,version_expediente,motivo?}` | 204; requiere reapertura si finalizado |
| POST | `/capturas/sesiones/{id}/lecturas` | Solicitar resolución / M | `{scan_id,valor,revision}` | 201 lectura pendiente idempotente |
| POST | `/capturas/sesiones/{id}/lecturas/{scan}/resolver` | Confirmación del escritorio / propietario E | `{revision,expediente_id?,rechazar?}` | Lectura aceptada/rechazada y SesionDTO |

Registrar rutas estáticas antes de dinámicas o restringir `{id}` a UUID, especialmente `resolver-etiqueta`, `seguimientos` y `exportacion`.

### 3.7. Transacciones y concurrencia

**Registro/reubicación:** verificar ámbito y ubicación; bloquear correlativo cuando proceda; crear/actualizar expediente; insertar movimiento y auditoría; commit único. Edición general y ruta de movimiento comparten servicio para no duplicar historial.

**Captura móvil:**

1. Propietario crea/recupera sesión. Invitación con secreto aleatorio de al menos 256 bits, un uso y TTL inicial propuesto de cinco minutos. El ID de sesión no concede acceso.
2. Canjear mediante POST y cookie móvil HttpOnly restringida. Enlace con invitación en fragmento de URL y retirada mediante history.replaceState tras canje; no guardar credenciales en localStorage/sessionStorage.
3. Activar adquiere bloqueo por expediente, valida custodia y aumenta revisión al cambiar selección. Pausa/cierre/finalización invalidan capturas anteriores. El móvil confirma la revisión antes de fotografiar.
4. Reserva fija expediente/revisión bajo bloqueo de fila de sesión; máximo una pendiente por sesión. TTL propuesto de 15 minutos, compatible con demo.
5. Subida valida credencial, reserva, estado, revisión, contenido y tamaño. Reintento recibido devuelve página original aunque haya cambiado la selección, después de comprobar autorización y mismo checksum/payload.
6. Disco y SQL no comparten transacción: escribir temporal privado, registrar PENDIENTE, promover a ruta final y marcar DISPONIBLE. Reconciliador/reintento completa o limpia operaciones interrumpidas. No anunciar éxito antes de quedar disponible.
7. Posición de página asignada bajo bloqueo del expediente. Reordenar verifica conjunto exacto de páginas activas y versión; primero usa posiciones temporales libres y luego definitivas en transacción. Contemplar filas eliminadas que aún ocupan el índice único; mover sus posiciones a un rango reservado antes de reutilizarlas.
8. Finalizar exige páginas disponibles y ninguna reserva. Cerrar conserva páginas, pausa el activo y revoca vínculo; no equivale a finalizar.
9. Resolver lecturas en servidor, no contra el array React. Ambigüedad requiere elección entre candidatos autorizados. Lectura pendiente vence a los 60 segundos como en demo.
10. Polling inicial cada dos segundos, una petición activa, backoff al fallar y reducción en segundo plano. sequence crece por mutaciones, no por GET; descartar respuestas atrasadas. TTL máximo de sesión propuesto: ocho horas, sin renovación indefinida por heartbeat.

Usar orden de bloqueos consistente (sesión → expedientes por ID → reservas/páginas), reintentos acotados de deadlocks y expiración de bloqueos. Eliminar `estado`/`estadoDigital`/`operations.statuses` divergentes mediante DTO temporal y estado canónico servidor.

## 4. ESTRATEGIA DE AUTENTICACIÓN Y SEGURIDAD

### 4.1. Sesiones con Sanctum

Sanctum en modo SPA, sesiones de servidor y cookies. Flujo: GET CSRF → POST login → GET me → peticiones autenticadas → POST logout.

Con fetch usar `credentials: 'include'` y copiar explícitamente XSRF-TOKEN decodificado a X-XSRF-TOKEN en mutaciones. Cookie de sesión HttpOnly; XSRF-TOKEN legible para ese encabezado. Configurar middleware stateful y CSRF según versión instalada. Regenerar ID al autenticar, invalidar logout/desactivación/restablecimiento. Contraseñas con hash Laravel (Argon2id o bcrypt según soporte).

Desarrollo: mismo hostname para Vite/API, orígenes exactos, puertos stateful y CORS con credenciales; no wildcard con cookies. Producción: preferentemente mismo origen, React en `/` y API en `/api/v1`, HTTPS confiable incluso en red interna para cookies Secure y cámara getUserMedia.

Límites iniciales propuestos: cinco intentos de login por minuto por IP/correo y cinco canjes por minuto por IP. Lecturas/cargas tienen límites separados compatibles con polling; ajustar con pruebas reales.

### 4.2. Roles y permisos

La UI no distingue roles actualmente. Estos perfiles son propuestas alineadas con antecedentes y requieren aprobación institucional.

| Operación | Administrador técnico | Encargado |
|---|---|---|
| Usuarios/roles/asignación de áreas | Sí | No |
| Consultar documentos/imágenes/imprimir | Con área documental asignada | En sus áreas |
| Registrar/editar/reubicar/levantar | Con permiso documental | Sí |
| Configurar ubicaciones/capacidades | Con permiso documental | Propuesto, confirmar |
| Digitalizar/ordenar | Con permiso documental | Sí |
| Finalizar/reabrir | Con permiso documental | Propuesto, confirmar |
| Eliminar/restaurar | Permiso específico | Confirmar |
| Vaciado general | Permiso administrativo y documental específico | No por defecto |
| Avisos/auditoría | Permiso específico | Según asignación |

Policies verifican usuario activo, acción y custodia para recursos, imágenes, exportaciones, sesiones y restauraciones. Filtrar por áreas autorizadas antes de aplicar filtros enviados por cliente. Ocultar controles en React mejora navegación, pero no sustituye autorización backend.

### 4.3. Controles ligados a los flujos existentes

- Demo permite estado/imágenes/cargas conociendo ID de sesión: reemplazarlo por credencial de usuario o vínculo móvil. El móvil no puede listar expedientes, finalizar, eliminar ni cambiar permisos.
- Vínculo con expiración/revocación y CSRF/Origin en mutaciones. Verificar que propietario sigue activo y autorizado en cada petición móvil.
- Imágenes JPEG/PNG/WebP hasta 12 MiB como actualmente; validar MIME real con Fileinfo/decodificación, dimensiones máximas y nombre generado. Almacenamiento sin ejecución PHP y sin rutas suministradas por cliente.
- Form Requests con campos permitidos; cliente no asigna autor, ruta, permisos ni estado final directamente. Eloquent/SQL parametrizado y sort en lista blanca.
- Errores sin stack/secretos; logs con request_id sin contraseñas, cookies, invitaciones o binarios. Escapar observaciones/avisos, enlaces HTTP/HTTPS únicamente.
- XLSX con celdas de texto explícitas para impedir fórmulas provenientes de códigos/notas con `=`, `+`, `-` o `@`.
- Webroot Laravel limitado a public. Como estará bajo htdocs, bloquear también acceso desde el sitio predeterminado a raíz del backend, .env, storage y vendor.

## 5. SERVICIOS EXTERNOS Y ALMACENAMIENTO

### 5.1. Integraciones requeridas

| Servicio | Uso | Decisión inicial |
|---|---|---|
| MySQL | Persistencia transaccional | Servidor interno, usuario exclusivo de aplicación |
| Disco privado | Fotos/miniaturas/exportaciones | storage/app/private; sin storage:link público para documentos |
| Cámara/lector | Captura y escaneo | APIs navegador y @zxing/browser existentes; HTTPS confiable |
| QR/barras | Etiquetas y vinculación | Mantener qrcode/jsbarcode; no servicio externo de pago |
| XLSX | Exportar Excel | Biblioteca compatible como PhpSpreadsheet, versión fijada en Composer |
| SMTP institucional | Recuperar contraseña | Opcional; restablecimiento administrativo si no está disponible |
| Cola/scheduler | Miniaturas, exportaciones grandes, expiraciones y temporales | Driver database inicialmente, worker/tarea supervisados |

No se detectan pagos, OAuth, OCR, firma digital ni PDF consolidado. Incorporarlos exige alcance adicional; no son dependencias del MVP.

### 5.2. Archivos y operación

- MySQL guarda metadatos y checksum, no base64/BLOB de imágenes. Claves opacas por expediente/página; originales y miniaturas privadas.
- Fotografías sobreviven a cierre de sesión. No usar carpeta temporal demo como repositorio definitivo.
- Entrega mediante controlador autorizado o aceleración interna tras comprobar permiso; no devolver rutas físicas en JSON.
- upload_max_filesize y límite web permiten 12 MiB por imagen; post_max_size mayor por overhead multipart. Manejar 413 incluso si Apache rechaza antes de Laravel.
- Estimar disco = expedientes × páginas promedio × bytes promedio, más miniaturas, temporales y backups. Confirmar volumen/dispositivos antes de fijar cuotas.
- Respaldos coordinados MySQL + archivos, fuera del disco principal, cifrados, con manifiesto/checksums. Probar restauración completa y acordar RPO/RTO/retención con responsable.
- Scheduler limpia invitaciones/reservas vencidas, temporales huérfanos y exportaciones expiradas; no documentos confirmados por cerrar sesión.
- Monitorear espacio, cola, fallos de carga, latencia y 5xx; diagnóstico detallado restringido, health mínimo público.

## 6. HOJA DE RUTA / PLAN DE EJECUCIÓN PASO A PASO

### Etapa 1: Configuración inicial del entorno backend y base de datos

1. Cerrar custodia, código, años, folios y permisos de las secciones 1.3/4.2. Documentar decisiones separadas de propuestas.
2. Verificar en vivo PHP CLI/web, Composer, motor SQL, puertos y carpeta independiente. pasos.md registra PHP 8.2.12 y propone Laravel 13 con PHP 8.4; comprobar requisitos oficiales y compatibilidad antes de instalar. No ignorar requisitos de plataforma.
3. Seguir pasos.md para preparar PHP/Composer/MySQL e instalar Laravel en `C:\xampp\htdocs\ALMACEN-BACKEND`, no dentro de src.
4. Crear base/usuario dedicado y configurar .env del backend: APP_URL, DB_*, sesión database, cola database, disco privado y SMTP opcional. React solo recibe URL pública API, nunca secretos.
5. Preparar webroot, CORS/CSRF, logging, /health y OpenAPI con contratos/errores de sección 3.
6. Crear migraciones y seeders de entidad, áreas, estructura inicial y tipos. No sembrar expedientes de prueba en producción. La estructura actual no trae niveles: configurarlos/crearlos al registrar.
7. Migrar base vacía, comprobar FKs/índices y configurar base de pruebas separada.

**Entregable:** Laravel conecta a MySQL y responde; migraciones reproducibles y estructura consultable. Registrar versiones reales en guía de entorno.

### Etapa 2: Implementación de autenticación y usuarios

1. Crear usuarios UUID, áreas autorizadas, sesiones y Policies.
2. Implementar CSRF/login/me/logout/cambio de contraseña y administración de cuentas. Administrador inicial con credencial suministrada, sin contraseña fija en código.
3. Crear `src/services/api.ts`: credentials, CSRF, JSON/descargas, errores y cancelación; cliente auth y proveedor de sesión.
4. Conectar LoginPage y protección de navegación de App; añadir logout. Ruta móvil conserva entrada de canje con permisos restringidos.
5. Conectar recuperación SMTP si existe; de lo contrario el botón informa el procedimiento administrativo real.
6. Probar credenciales incorrectas, sesión vencida, CSRF, logout, inactivo y acceso a otra área.

**Entregable:** login y recarga conservan acceso mientras la sesión sea válida; llamadas directas no autorizadas no obtienen documentos.

### Etapa 3: Desarrollo de CRUDs base por módulos prioritarios

1. Implementar estructura/catálogos y conectar ConfigEstantes, numeración concurrente y protección de módulos ocupados.
2. Implementar expedientes, correlativos, movimientos y baja lógica. Crear adaptador DTO → Expediente y tipos para IDs/versiones.
3. Convertir handleSave/handleEdit/handleDelete y formularios a async. Limpiar y mostrar éxito solo tras confirmación; conservar datos si falla.
4. Sustituir fuente de archivosMemory/estructuraMemory por API. Memoria puede quedar como caché visual; MySQL es fuente de verdad. Invalidar lista/detalle/dashboard/estructura tras mutaciones.
5. Conectar buscador, etiquetas, detalle, mapa e historial. Mantener selección por ID entre páginas y validar todos los IDs al imprimir.
6. Dashboard/capacidades por agregados globales. Corregir orden de recientes y mensaje de persistencia.
7. Persistir levantamiento y exportación Excel, con subtotales por unidad y mismos filtros/permisos del listado.

**Primera entrega:** login → registrar → recargar → consultar desde otra computadora autorizada → cambiar ubicación → ver historial → imprimir QR que resuelva el mismo ID.

**Criterio:** totales no se calculan sobre una página parcial y un error de API no borra formularios ni anuncia registros inexistentes.

### Etapa 4: Lógica de negocio avanzada e integraciones

1. Implementar sesiones, vínculos, reservas, lecturas y páginas con máquina de estados y bloqueos.
2. Sustituir demoRequest/readDemo/syncPages/imageUrl por API persistente; adaptar Digitalizacion, CapturaMovil y useMobileScanBridge.
3. Recuperar sesiones del propietario tras recarga desde MySQL; vínculo móvil desde cookie válida, sin depender de key en memoria del escritorio.
4. Implementar carga idempotente, promoción de temporales/reconciliación, miniaturas y validación de límites/contenido.
5. Persistir orden, eliminación, pausa, finalización y reapertura; estado único en todas las pantallas.
6. Polling con revision/sequence, expiraciones, revocación y recuperación de red. Probar cámara/QR en celular físico con dirección definitiva.
7. Conectar revisión de calidad y, si se mantiene alcance, UI de avisos/seguimiento personal. Tipos existentes no equivalen a administración terminada.
8. Evaluar migración demo: importador JSON/imágenes con simulación, mapeo de IDs e informe de conflictos. Imagen cuyo expediente solo existía en memoria queda pendiente de asignación; no inventar metadatos. Preservar IDs de etiquetas existentes o registrar alias explícitos.
9. Tras validar captura nueva y migración, retirar uso de demo.php en producción. Verificar archivos migrados antes de limpiar el repositorio demo.

**Entregable:** fotos y orden sobreviven recargas/reinicio; reintentos no duplican páginas y una selección antigua no carga en otro expediente.

### Etapa 5: Pruebas, integración con el Frontend y preparación para despliegue

1. Pruebas Laravel sobre MySQL de pruebas: auth/Policies, validaciones, código concurrente, movimiento atómico, bajas/restauraciones, scope y paginación.
2. Captura: sesiones compitiendo, reservas simultáneas, subida repetida, pérdida de respuesta, reserva vencida, cambio/pausa/cierre con foto pendiente, credencial revocada, archivo inválido/grande, fallo de disco, orden concurrente, finalizar vacío y reapertura.
3. Lecturas: QR único, código repetido, payload malformado, expediente eliminado, otra área y lectura vencida; compatibilidad de etiquetas.
4. Playwright con API de pruebas: login, alta, recarga, segunda sesión autorizada, búsqueda/etiquetas, movimiento, galería, Excel y errores. `npm run test:demo` actual prueba demo, no Laravel; migrar esa cobertura antes de retirarlo.
5. Ejecutar `php artisan test` en backend; `npm run build`, `npm run lint`, `npm run test:alerts`, `npm run test:labels` en frontend según integración. Adaptar pruebas por contratos nuevos sin ocultar fallos preexistentes.
6. Medir consultas/dashboard/cargas con volumen acordado; EXPLAIN, N+1, concurrencia de polling y memoria XLSX. Establecer objetivos según equipo real.
7. Preparar HTTPS, React compilado, dependencias bloqueadas, APP_DEBUG=false, migraciones controladas, cachés, worker y scheduler supervisados también en Windows. No usar Vite dev server como servicio final.
8. Ajustar base/rutas al despliegue: App compara /archivo y /levantamiento literalmente; publicar bajo /ALMACEN/ exige configuración adicional o servir desde raíz del sitio.
9. Probar backup/restauración BD+archivos y reversión de despliegue; comprobar que sitio predeterminado no exponga raíz del backend.
10. Capacitar al encargado y documentar accesos, registro, movimiento, impresión, captura, errores, respaldos y operación diaria.

**Cierre:** datos consistentes entre dispositivos, imágenes privadas, autorización efectiva, exportaciones completas, pruebas críticas aprobadas y restauración verificada.

### Orden inmediato recomendado

1. Aprobar reglas pendientes y permisos.
2. Verificar/preparar entorno siguiendo pasos.md.
3. Instalar/configurar Laravel y MySQL en la carpeta independiente.
4. Implementar auth + estructura + expedientes e integrarlos con React.
5. Completar digitalización persistente, levantamiento/exportaciones, pruebas y despliegue según las etapas anteriores.

La prioridad técnica es un expediente persistente, autenticado y consultable desde dos equipos. Esa base permite incorporar digitalización sin depender del estado temporal del navegador.

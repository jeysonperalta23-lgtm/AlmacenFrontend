# Parte 5. Implementación en Laravel e integración con React

[Volver al índice](../../ANALISIS_BACKEND.md)

## 1. Punto de partida

Conservar la instalación existente de `C:/xampp/htdocs/ALMACEN-BACKEND`. El código fuente del frontend está en `C:/xampp/htdocs/ALMACEN`. La copia de Documentos necesita recuperar `src/`, `tests/` y `scripts/` si se decide desarrollar desde ella; no reconstruir el código desde `dist` cuando existe la fuente original.

Antes de cambiar carpetas, comparar archivos y establecer cuál será la copia de trabajo. Respaldar código y datos; conservar `package-lock.json` y `composer.lock`. No copiar `.env` con secretos al frontend ni incluir dependencias instaladas como sustituto de un repositorio completo.

El `INICIO.md` del backend registra MySQL local en puerto 3307 y arranque manual. Verificar ese entorno con el responsable antes de seguir instrucciones antiguas para instalar otro motor o recrear la base. Esta revisión no arrancó ni apagó servicios.

## 2. Organización de responsabilidades

```text
app/
  Http/
    Controllers/Api/V1/
      AuthController.php
      UsuarioController.php
      CatalogoController.php
      EstructuraController.php
      ExpedienteController.php
      MovimientoExpedienteController.php
      SesionCapturaController.php
      CapturaMovilController.php
      PaginaExpedienteController.php
      LevantamientoController.php
      ReporteController.php
      AuditoriaController.php
    Requests/                 # Datos permitidos y validación
    Resources/                # Respuestas explícitas
    Middleware/               # Usuario activo y credencial móvil
  Models/
  Policies/                   # Permisos por recurso y custodia
  Services/
    RegistrarExpediente.php
    ReubicarExpediente.php
    AsignarCorrelativo.php
    GestionarSesionCaptura.php
    RecibirPagina.php
    OrdenarPaginas.php
    GenerarReporte.php
  Jobs/                       # Si se requieren miniaturas/exportaciones
database/
  migrations/
  factories/
  seeders/
routes/api.php
tests/Feature/
tests/Unit/
```

Los nombres son una propuesta; pueden agruparse por módulo al crecer. El controlador recibe la solicitud y devuelve una respuesta. Los servicios ejecutan reglas de negocio; las Policies comprueban permisos. Los Resources evitan exponer rutas privadas, claves o atributos internos.

Laravel permite encapsular autorización y validación en Form Requests. La propuesta es usar uno por operación relevante, por ejemplo `StoreExpedienteRequest`, `MoveExpedienteRequest` y `UploadPaginaRequest`. [Validación oficial](https://laravel.com/framework/docs/13.x/validation).

Para dos roles iniciales no hace falta un editor de permisos complejo: definir la matriz de operaciones especiales en Policies/configuración versionada. Si se necesitan excepciones por persona, diseñarlas explícitamente; no dispersar comparaciones de rol en todos los controladores.

## 3. Alta de un expediente: algoritmo de referencia

El siguiente pseudocódigo explica el servicio; no es código PHP listo para copiar.

```text
autorizar usuario y área de custodia
validar campos permitidos y clave de idempotencia
iniciar transacción
  obtener/crear operación idempotente protegida por índice único
  si ya está confirmada:
    comprobar hash y permisos actuales; devolver recurso existente
  verificar ubicación, catálogos y pertenencia al ámbito
  crear de forma segura la fila de correlativo si falta
  bloquear correlativo del área y periodo
  incrementar número y construir código
  insertar expediente con ID del servidor y versión 1
  insertar movimiento inicial y auditoría
  marcar operación idempotente como confirmada
confirmar transacción
devolver HTTP 201 con Resource
```

Usar transacciones para que expediente, correlativo e historial se confirmen juntos. Laravel dispone de `DB::transaction` y reintentos acotados ante interbloqueos. No ejecutar acciones externas irreversibles dentro de una función que podría reintentarse. [Transacciones oficiales](https://laravel.com/framework/docs/13.x/database#database-transactions).

La política de expiración de idempotencia debe cubrir el periodo razonable de reintentos y quedar documentada. Desactivar temporalmente el botón evita dobles clics, pero no reemplaza esta protección del servidor.

## 4. Integración por archivo

| Archivo actual del frontend | Cambio necesario |
|---|---|
| `src/App.tsx` | Cargar sesión y proteger navegación; mantener acceso al canje móvil |
| `src/pages/Login/LoginPage.tsx` | Login real, errores, carga, recuperación según infraestructura y textos documentales |
| `src/services/archiveMemory.ts` | Sustituir fuente de verdad por consultas API; memoria solo como caché |
| `src/pages/Archivo/ArchivoCentral.tsx` | Handlers asíncronos; usar ID, versión, fechas y estado devueltos |
| `src/components/archive/FormExpediente.tsx` | `onSave` devuelve promesa; errores por campo; no limpiar antes de confirmar |
| `src/components/archive/ConfigEstantes.tsx` | Catálogos por ID, alta remota y error de ubicación ocupada |
| `src/components/archive/MapaEstantes.tsx` | Estructura y conteos del servidor, carga por ubicación |
| `src/components/archive/EtiquetadoArchivo.tsx` | Filtros/paginación remotos; selección por ID entre páginas |
| `src/utils/archiveLabels.ts` | Mantener formato QR; resolución remota del catálogo completo |
| `src/components/archive/DashboardInicio.tsx` | Agregados centrales; separar contenidos estáticos y métricas reales |
| `src/services/digitalizacionMemory.ts` | API de sesiones, vínculos, reservas y páginas persistentes |
| `src/components/archive/Digitalizacion.tsx` | Recuperar estado remoto, guardar orden, finalizar y reabrir con permisos |
| `src/pages/Archivo/CapturaMovil.tsx` | Canje y cookie de captura; conservar reintentos y revisión esperada |
| `src/hooks/useMobileScanBridge.ts` | Recibir eventos resueltos por servidor, sin buscar solo en lista local |
| `src/pages/Inventario/LevantamientoPage.tsx` | Jornadas y registros remotos, ID/versión del backend |
| `src/components/inventory/TablaInventario.tsx` | Exportación real y subtotales por unidad |
| `src/types/archive.ts`, `src/types/inventory.ts` | DTOs con IDs, versión, estado único y errores tipados |

Clientes propuestos: `api.ts`, `authApi.ts`, `catalogosApi.ts`, `expedientesApi.ts`, `digitalizacionApi.ts`, `levantamientoApi.ts` y `reportesApi.ts`.

`api.ts` centraliza prefijo, cookies, CSRF, JSON, descargas, cancelación y errores. Ante `401`, recuperar acceso; ante `419`, renovar el contexto CSRF y pedir reenvío controlado; ante `409`, mostrar el conflicto. No reintentar automáticamente un alta sin clave de idempotencia.

El proxy de Vite debe incluir `/api` y `/sanctum` hacia Laravel durante desarrollo. Actualmente solo contiene `/demo-api`. En producción se propone frontend y API bajo un mismo origen HTTPS; la configuración final dependerá del servidor municipal.

## 5. Mapeo entre datos antiguos y nuevos

| Actual | Nuevo | Tratamiento |
|---|---|---|
| `estante`, `modulo`, `nivel` en texto | `nivel_id` y objeto de ubicación | Resolver contra catálogos, no fabricar IDs en React |
| `tipo` | `tipo_documental_id` | Catálogo normalizado |
| `anio` texto | `anio_documental` entero | Validación de rango |
| `obs` | `observaciones` | Mantener contenido y aplicar límite |
| `area` opcional | `area_origen_id` | Mapeo revisado; separar custodia |
| `codigo` sugerido | `codigo_referencia` y nuevo `codigo` | Conservar identificación previa como referencia |
| `estado`, `estadoDigital` | `estado_digital` | Normalizar explícitamente; ausencia inicial a `SIN_INICIAR` |
| `historialUbicacion[]` | `movimientos_expediente` | Importar como antecedente si es fiable; no inventar autor |
| Fotos e índice en memoria | `paginas_expediente` + disco privado | Importar solo con correspondencia verificable |

No convertir automáticamente IDs antiguos `exp_...` a UUID si ya se imprimieron etiquetas. Preservar los IDs admitidos o crear una tabla `alias_expediente` para resolver el QR antiguo al nuevo. Esa tabla solo es necesaria si existen datos/etiquetas reales que migrar.

El texto fijo de institución debe salir de configuración. La condición actual “si el nombre del módulo contiene Abastecimiento” debe sustituirse por reglas documentales explícitas.

## 6. Escritura segura de una fotografía

Disco y base de datos pueden fallar en momentos diferentes. Flujo propuesto:

1. Autenticar dispositivo y validar reserva, revisión y permisos.
2. Validar y escribir imagen en un temporal privado con nombre del servidor.
3. Calcular checksum. Si ya existe captura confirmada, comparar identidad y contenido; descartar solo el temporal de este intento y devolver la página.
4. En una transacción breve, bloquear expediente/sesión/reserva en orden acordado y registrar página `PENDIENTE`. La reserva pasa a `RECIBIENDO`; las acciones de cambio o cierre respetan ese estado.
5. Promover el archivo a su ruta definitiva. Configurar operaciones de almacenamiento para detectar y propagar errores.
6. En otra transacción, verificar que la operación sigue siendo válida, marcar página `CONFIRMADA`, asignar orden, aumentar versión del expediente y secuencia, y confirmar reserva.
7. Si falla, conservar un estado recuperable. Un reconciliador revisa operaciones atascadas; una página solo se vuelve visible cuando su archivo está verificado.

Si el proceso cae después del movimiento físico pero antes del commit final, el reconciliador comprueba el archivo y termina la operación o marca fallo con trazabilidad. Si falta el archivo de una página confirmada, generar alerta y restaurar desde copia; no informar al usuario que la carga fue correcta.

Propuesta de almacenamiento: `storage/app/private/expedientes/<id>/<pagina>.<ext>` y temporales separados. La configuración real del disco debe verificarse; no publicar las fotografías mediante un enlace al disco público. [Almacenamiento oficial de Laravel](https://laravel.com/framework/docs/13.x/filesystem).

Generar miniaturas es opcional para la primera carga funcional. Si se hace en cola, encolar después del commit y no bloquear la consulta del original mientras se genera la miniatura. Las tareas de vencimiento limpian reservas y credenciales; no borran páginas documentales por expirar una sesión.

## 7. Migración de demostración

Primero comprobar si existe información real que conservar. La ausencia de expedientes tras recargar no demuestra ausencia de fotos en el directorio del receptor.

Preparar inventario de JSON/imágenes sin borrarlos, mapeo de IDs, simulación de importación e informe de inconsistencias. Fotografías sin metadatos de expediente recuperables quedan pendientes de asignación humana. Un importador debe ser repetible, conservar originales y verificar checksum y conteos. Cambiar a la API nueva solo después de comprobar resultados.

## 8. Entregas incrementales

| Entrega | Trabajo | Condición para avanzar |
|---|---|---|
| A. Base de trabajo | Copia completa, entorno verificado, reglas documentadas | Se puede reproducir el arranque sin reinstalaciones improvisadas |
| B. Acceso | Usuarios, roles, áreas, login/me/logout, React protegido | Pruebas de acceso y aislamiento aprobadas |
| C. Catálogo persistente | Estructura, tipos, expedientes, código, movimientos | Registrar y recuperar desde dos equipos |
| D. Consulta | Búsqueda, QR, mapa, selección, dashboard | Resultados globales y etiquetas estables |
| E. Digitalización | Vínculos, reservas, archivos, estados, orden, recuperación | Reintentos y cambios de expediente sin errores de asociación |
| F. Operación | Jornadas, exportaciones, auditoría y reportes | Totales conciliados y permisos consistentes |
| G. Entrega | Despliegue, pruebas de usuario, respaldo/restauración y manuales | Recorrido completo y recuperación documentados |

No fijar un porcentaje de avance solo por la cantidad de pantallas: una interfaz terminada no acredita persistencia, permisos ni operación multiusuario.

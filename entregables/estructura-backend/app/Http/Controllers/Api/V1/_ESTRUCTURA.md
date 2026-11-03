# Controladores API v1

Reciben solicitudes validadas, comprueban permisos, llaman a servicios y devuelven
Resources o respuestas JSON. No concentrar aquí consultas y reglas de negocio.

Crear según se implemente cada etapa:

- `AuthController.php`: iniciar sesión, consultar identidad y cerrar sesión.
- `EstructuraController.php`: consultar estantes, módulos y niveles.
- `EstanteController.php`, `ModuloController.php`, `NivelController.php`: configuración.
- `ExpedienteController.php`: registro, consulta, edición y baja lógica.
- `MovimientoExpedienteController.php`: reubicaciones e historial.
- `SesionCapturaController.php`, `CapturaMovilController.php`: vinculación móvil.
- `PaginaExpedienteController.php`: fotografías y orden de páginas.
- `LevantamientoController.php`: jornadas y registros físicos.

Namespace previsto: `App\Http\Controllers\Api\V1`.
Registrar las rutas en el grupo `v1` de `routes/api.php` al implementar cada acción.
La ruta de estado existente se mantiene.

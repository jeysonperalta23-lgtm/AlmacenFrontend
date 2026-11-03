# Modelos

Conservar `User.php`. Crear los demás modelos junto con sus migraciones:

1. `Institucion`, `Area`, `Estante`, `Modulo`, `Nivel`.
2. `TipoDocumental`, `Expediente`, `MovimientoExpediente`, `Correlativo`.
3. `SesionCaptura`, `VinculacionCaptura`, `ReservaCaptura`, `PaginaExpediente`.
4. `JornadaLevantamiento`, `RegistroLevantamiento`.

Seguir el modelo de datos de `docs/backend/03-base-de-datos.md` del frontend.
Declarar nombres de tablas explícitos cuando sea necesario para nombres españoles.
Conservar la clave numérica existente de usuarios y usar UUID para las entidades
documentales según el plan. Los módulos físicos no equivalen automáticamente a áreas.

# Estructura para ampliar ALMACEN-BACKEND

Destino: `C:\xampp\htdocs\ALMACEN-BACKEND`.
Frontend actual: `C:\Users\JEISON\Documents\ALMACEN`.

El backend ya tiene Laravel, Sanctum, configuración, migraciones base y la ruta
`GET /api/v1/estado`. Esta ruta comprueba la conexión a la base de datos.
Este paquete agrega organización y guías de implementación; no instala Laravel,
no crea tablas, no cambia credenciales y no implementa todavía los módulos.

## Incorporar las carpetas

Extraer `estructura-backend.zip` directamente dentro de
`C:\xampp\htdocs\ALMACEN-BACKEND`. Las carpetas `app`, `database`, `docs` y `tests`
del paquete deben quedar dentro de esa carpeta, junto a `artisan`.
El paquete no contiene archivos de configuración ni código existente para reemplazar.
Si ya incorporaste este paquete, compara las guías antes de sustituirlas.

También puedes abrir `C:\xampp\htdocs\ALMACEN-BACKEND` como proyecto en el editor
para continuar el desarrollo directamente allí.

## Organización final

```text
ALMACEN-BACKEND/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/   # Recibir peticiones y responder JSON
│   │   ├── Requests/            # Validar datos de entrada
│   │   ├── Resources/           # Definir los campos de las respuestas
│   │   └── Middleware/          # Comprobaciones comunes de acceso
│   ├── Models/                 # Entidades y relaciones
│   ├── Policies/               # Permisos por usuario y recurso
│   ├── Services/
│   │   ├── Estructura/          # Estantes, módulos y niveles
│   │   ├── Expedientes/        # Registro, códigos e historial
│   │   ├── Digitalizacion/     # Sesiones móviles y páginas
│   │   └── Levantamiento/      # Jornadas y registros físicos
│   └── Providers/              # Proveedores existentes de Laravel
├── bootstrap/                  # Arranque existente
├── config/                     # Configuración existente
├── database/
│   ├── migrations/             # Cambios versionados de las tablas
│   ├── factories/              # Datos para pruebas
│   └── seeders/                # Catálogos iniciales
├── docs/                       # Contrato, etapas e integración
├── public/                     # Única carpeta que debe servir la web
├── routes/api.php              # Rutas de la API existente
├── storage/app/private/        # Fotografías privadas, al implementar captura
├── tests/
│   ├── Feature/Api/V1/         # Pruebas HTTP de los módulos
│   └── Unit/Services/           # Pruebas de reglas de negocio
├── .env                        # Configuración privada existente
├── artisan
└── composer.json
```

Las carpetas nuevas contienen guías `_ESTRUCTURA.md`. Los archivos PHP de cada
módulo se crearán cuando se implemente su comportamiento; no hay endpoints vacíos.
Las carpetas base de Laravel que aparecen arriba ya pertenecen al backend existente.

## Primer resultado a construir

Crear un estante desde React, guardarlo en MySQL y recuperarlo al recargar.
Antes de implementar las tablas, definir la institución y el área de custodia:
los planes existentes vinculan cada estante a un área, no solo a un nombre libre.

Consultar `docs/ETAPAS_BACKEND.md` y `docs/CONEXION_FRONTEND.md`.

Los planes completos siguen en el frontend: `planbackend.md` y `docs/backend/`.
No se copian aquí para evitar dos versiones diferentes del diseño.

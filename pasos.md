# Pasos para crear el backend independiente con Laravel y MySQL

**Proyecto:** Archivo Documental Municipal — ALMACEN  
**Fecha:** 14 de septiembre de 2026  
**Frontend:** `C:\xampp\htdocs\ALMACEN`  
**Backend independiente:** `C:\xampp\htdocs\ALMACEN-BACKEND`  
**Plan funcional:** [planbackend.md](planbackend.md)

## 1. Qué está hecho y qué falta

### Realizado

- Se creó la carpeta independiente `C:\xampp\htdocs\ALMACEN-BACKEND`.
- Se dejó vacía para que Composer pueda instalar Laravel directamente en ella.
- Se revisó el entorno y se escribió esta guía.

### Pendiente de ejecutar siguiendo esta guía

- Preparar PHP compatible e instalar Composer.
- Instalar y configurar MySQL.
- Descargar Laravel dentro de la carpeta creada.
- Crear la base de datos y configurar `.env`.
- Instalar Sanctum, ejecutar migraciones y comprobar la API.
- Conectar React e implementar los módulos del plan.

**Crear la carpeta no equivale a instalar Laravel.** Todavía no hay `artisan`, controladores ni una API implementada en esa carpeta. Los comandos y fragmentos siguientes son instrucciones para realizar la instalación; no se han ejecutado automáticamente.

## 2. Cómo quedarán las carpetas

```text
C:\xampp\htdocs\
├── ALMACEN\                      # Frontend existente: React + TypeScript
│   ├── src\
│   ├── tests\
│   ├── package.json
│   ├── vite.config.ts
│   ├── planbackend.md
│   └── pasos.md
│
└── ALMACEN-BACKEND\              # Laravel, independiente del frontend
    ├── app\                     # Se generará durante la instalación
    ├── bootstrap\
    ├── config\
    ├── database\
    ├── public\
    ├── routes\
    ├── storage\
    ├── tests\
    ├── vendor\
    ├── .env
    ├── artisan
    └── composer.json
```

No crear otra carpeta `backend` dentro de ALMACEN ni instalar Laravel dentro de `src`. Los dos proyectos se comunicarán mediante HTTP, no importando archivos PHP en React.

Esta ubicación independiente sustituye la propuesta inicial de `ALMACEN\backend` del plan original.

### Antes de guardar secretos dentro de htdocs

Laravel debe exponerse por su carpeta `public`, nunca por la raíz del proyecto. Como la carpeta elegida está bajo `htdocs`, antes de crear el `.env`:

1. Mantener detenido Apache de XAMPP durante esta instalación local. Para las primeras pruebas se utilizará `php artisan serve`, que sirve el directorio público.
2. Antes de volver a iniciar Apache, configurar su acceso para impedir que el sitio predeterminado permita descargar archivos desde `/ALMACEN-BACKEND/`.
3. Al publicar Laravel con Apache, utilizar un sitio cuya raíz sea exclusivamente `ALMACEN-BACKEND/public`, con una versión de PHP compatible.

En la puesta en servicio se deberá comprobar que solicitudes a `.env`, `composer.json` y `storage/` desde el sitio predeterminado y desde el sitio del backend son rechazadas o no existen. Un virtual host adicional no corrige por sí solo el acceso a través del sitio predeterminado.

## 3. Qué terminal utilizar

Los comandos están escritos para **Windows PowerShell**. Ejecutarlos en el orden indicado y detenerse si uno falla.

Cuando se indique una carpeta de trabajo, abrir una terminal allí. También se puede utilizar:

```powershell
Set-Location -LiteralPath "C:\xampp\htdocs\ALMACEN-BACKEND"
```

En PowerShell 5.1 no utilizar `&&` para unir comandos. Las rutas con espacios deben ir entre comillas. Para ejecutar un programa mediante su ruta completa se utiliza `&`.

Se usarán estas direcciones exclusivamente para desarrollo en la computadora:

| Servicio | Dirección o puerto |
|---|---|
| React | `http://127.0.0.1:5173` |
| Laravel | `http://127.0.0.1:8000` |
| MySQL | `127.0.0.1:3307` en el ejemplo de esta guía |

Utilizar siempre `127.0.0.1` durante estas pruebas, sin alternarlo con `localhost`, para evitar confusiones con cookies.

## 4. Preparar PHP compatible

### Situación comprobada

- Existe `C:\xampp\php\php.exe`, versión **8.2.12**.
- En la terminal revisada, `php`, `composer` y `mysql` no se resolvieron mediante `PATH`.
- El PHP de XAMPP tiene `pdo_mysql`, `mbstring`, `openssl`, `fileinfo` y otras extensiones; `zip` no apareció entre las cargadas.
- Según la documentación oficial consultada, **Laravel 13 requiere PHP 8.3 o superior**.

Esta guía propone **Laravel 13 con PHP 8.4**, usando la última actualización disponible de la rama 8.4. No se debe intentar instalar Laravel 13 sobre el PHP 8.2 actual ni utilizar `--ignore-platform-reqs` para ocultar la incompatibilidad.

### Instalación de PHP para la terminal

1. Descargar PHP para Windows desde <https://windows.php.net/download/>.
2. Elegir una distribución x64 de PHP 8.4. Para uso CLI/FastCGI se puede utilizar Non Thread Safe. No cargar esa distribución como módulo de Apache.
3. Instalar el redistribuible de Visual C++ requerido por esa distribución, indicado en la página oficial, si no está presente.
4. Extraer el paquete, por ejemplo, en `C:\tools\php84`.
5. Copiar `php.ini-development` como `php.ini` dentro de esa carpeta.
6. Revisar el `php.ini` y habilitar las extensiones necesarias, sin duplicar entradas:

```ini
extension_dir = "C:\tools\php84\ext"
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_mysql
extension=pdo_sqlite
extension=sqlite3
extension=zip
```

`pdo_sqlite` y `sqlite3` facilitan las pruebas predeterminadas de Laravel; la aplicación municipal utilizará MySQL. Más adelante puede requerirse `gd` para miniaturas. Las extensiones compiladas dentro de PHP no necesitan una entrada `extension=` adicional.

7. Comprobar el ejecutable antes de cambiar el PATH:

```powershell
& "C:\tools\php84\php.exe" -v
& "C:\tools\php84\php.exe" --ini
& "C:\tools\php84\php.exe" -m
```

8. En Variables de entorno de Windows, agregar `C:\tools\php84` al `Path` del usuario. Si hay otros PHP en el PATH, verificar cuál tiene precedencia.
9. Cerrar y abrir PowerShell y el editor para que reciban las nuevas variables.
10. Comprobar:

```powershell
Get-Command php
where.exe php
php -v
php --ini
php -m
```

**Resultado esperado:** `php` resuelve al PHP nuevo, compatible con Laravel 13, sin advertencias de extensiones.

Cambiar el PHP de la terminal no actualiza automáticamente el PHP que utiliza Apache de XAMPP. La configuración del servidor web definitivo se realizará posteriormente; no reemplazar a ciegas la carpeta de PHP de XAMPP.

## 5. Instalar Composer

1. Abrir <https://getcomposer.org/download/>.
2. Descargar el instalador oficial para Windows, `Composer-Setup.exe`.
3. Durante la instalación, seleccionar `C:\tools\php84\php.exe` como ejecutable PHP.
4. Terminar la instalación y abrir una terminal nueva.
5. Ejecutar:

```powershell
composer --version
composer diagnose
```

**Resultado esperado:** Composer responde y utiliza el PHP compatible. Resolver los errores de conectividad, certificados o extensiones antes de continuar.

Si hay errores de certificados, configurar una cadena de autoridades certificadoras válida para PHP y Composer. No desactivar TLS para descargar dependencias.

La instalación inicial necesita acceso a Internet para descargar Laravel y sus dependencias. El uso cotidiano del sistema podrá funcionar dentro de la red municipal.

## 6. Instalar MySQL

El cliente SQL encontrado en XAMPP corresponde a MariaDB. Como el motor elegido es MySQL, instalarlo explícitamente.

1. Descargar **MySQL Community Server 8.4 LTS**, en su actualización mantenida, desde <https://dev.mysql.com/downloads/mysql/>.
2. Instalar el servidor y completar su configuración para Windows.
3. Configurarlo como servicio de Windows.
4. Definir la contraseña administrativa y conservarla fuera de este documento.
5. Utilizar un puerto libre. Esta guía utiliza **3307** para separar MySQL del puerto habitual de MariaDB de XAMPP.
6. Mantener MySQL accesible desde el propio servidor; React y el celular se comunicarán con Laravel, no directamente con MySQL.
7. Instalar MySQL Workbench si se desea una interfaz gráfica. Workbench por sí solo no instala ni inicia un servidor de base de datos.

La ruta del cliente depende de la instalación. Ejemplo:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" --version
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" --host=127.0.0.1 --port=3307 --user=root --password
```

Introducir la contraseña cuando se solicite. Ya dentro del cliente SQL, ejecutar:

```sql
SELECT VERSION() AS version_servidor, @@port AS puerto;
```

**Resultado esperado:** responde el servidor MySQL instalado, en el puerto configurado. La salida debe verificar el servidor real; la versión del ejecutable cliente no es suficiente.

### Crear la base de datos y el usuario de desarrollo

Ejecutar estos comandos SQL una sola vez con una cuenta administrativa. Sustituir `REEMPLAZAR_CON_CLAVE_PRIVADA` por una contraseña real antes de ejecutar:

```sql
CREATE DATABASE almacen_municipal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

CREATE USER 'almacen_app'@'127.0.0.1'
  IDENTIFIED BY 'REEMPLAZAR_CON_CLAVE_PRIVADA';

GRANT ALL PRIVILEGES ON almacen_municipal.*
  TO 'almacen_app'@'127.0.0.1';
```

Los permisos anteriores están limitados a esta base y permiten ejecutar migraciones en desarrollo. Para la puesta en servicio, separar permisos de migración y operación cotidiana según el procedimiento de despliegue.

No utilizar `root` como credencial habitual de Laravel. Si la base o el usuario ya existen, revisar su configuración; no borrarlos para repetir estos comandos.

Salir del cliente con `exit` y comprobar la cuenta creada:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" --host=127.0.0.1 --port=3307 --user=almacen_app --password almacen_municipal
```

## 7. Instalar Laravel en la carpeta independiente

Antes de empezar, PHP y Composer deben responder correctamente y la carpeta `ALMACEN-BACKEND` debe continuar vacía.

### 7.1. Abrir la carpeta

```powershell
Set-Location -LiteralPath "C:\xampp\htdocs\ALMACEN-BACKEND"
Get-ChildItem -Force
```

La segunda instrucción permite comprobar que no hay archivos previos. Si ya existe un proyecto, no volver a ejecutar `create-project` encima.

### 7.2. Descargar el proyecto

```powershell
composer create-project laravel/laravel . "^13.0" --no-scripts
```

- El punto `.` significa “instalar en la carpeta actual”.
- `^13.0` fija la versión mayor de esta guía.
- `--no-scripts` deja para los pasos siguientes la configuración inicial y evita ejecutar automáticamente la creación/migración predeterminada de SQLite.
- Este comando genera la estructura de Laravel; no crea las tablas de expedientes ni implementa el login de React.

No seleccionar un starter kit que instale otro React o sustituya el frontend actual. Aquí Laravel funcionará como API independiente.

### 7.3. Preparar entorno y descubrimiento de paquetes

En la misma terminal:

```powershell
if (-not (Test-Path -LiteralPath ".env")) { Copy-Item -LiteralPath ".env.example" -Destination ".env" }
composer run-script post-autoload-dump
php artisan key:generate
php artisan --version
composer check-platform-reqs
```

`post-autoload-dump` ejecuta el descubrimiento de paquetes omitido al crear el proyecto sin scripts. La clave de aplicación se genera una vez al preparar esta instalación; no regenerarla rutinariamente en un sistema que ya tenga datos cifrados.

**Resultado esperado:** existe `artisan`, Laravel informa su versión y las comprobaciones de plataforma pasan.

## 8. Configurar el .env del backend

Abrir **`C:\xampp\htdocs\ALMACEN-BACKEND\.env`** y modificar las variables existentes, evitando líneas duplicadas:

```dotenv
APP_NAME="Archivo Municipal"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=almacen_municipal
DB_USERNAME=almacen_app
DB_PASSWORD="REEMPLAZAR_CON_CLAVE_PRIVADA"

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SESSION_COOKIE=almacen_session

CACHE_STORE=file
QUEUE_CONNECTION=sync

SANCTUM_STATEFUL_DOMAINS=127.0.0.1:5173,127.0.0.1:8000
```

Conservar `APP_KEY` generado. Reemplazar la contraseña por la misma que se asignó a `almacen_app` y el puerto si se eligió otro. Si quedaron variables `DB_URL` de otra configuración, revisarlas porque pueden cambiar la conexión efectiva.

`QUEUE_CONNECTION=sync` simplifica el arranque inicial. Cuando se implementen miniaturas o exportaciones grandes, se pasará a colas con un worker gestionado. `SESSION_DRIVER=database` requiere la tabla de sesiones creada por las migraciones.

`APP_DEBUG=true` y cookies sin `Secure` corresponden solo a esta prueba local por HTTP. Para la municipalidad se configurará HTTPS, `APP_DEBUG=false` y `SESSION_SECURE_COOKIE=true`.

El `.env` del backend contiene secretos. No copiarlo al frontend ni colocar credenciales SQL en variables que comiencen con `VITE_`.

Aplicar la configuración:

```powershell
php artisan config:clear
```

## 9. Instalar la API y Sanctum

En `ALMACEN-BACKEND`:

```powershell
php artisan install:api
```

Este comando instala Sanctum y prepara `routes/api.php` y la configuración correspondiente. Si pregunta si debe ejecutar migraciones, se puede responder que no para ejecutarlas explícitamente en el siguiente paso.

Abrir `bootstrap/app.php` y, dentro del bloque `withMiddleware` existente, agregar:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();
})
```

Utilizar la importación existente de `Illuminate\Foundation\Configuration\Middleware`. No duplicar todo el archivo ni eliminar las otras configuraciones de enrutamiento o excepciones.

Instalar Sanctum **no crea por sí solo** el endpoint de login, los roles ni las reglas de área. Esas funciones se implementarán después de comprobar la conexión básica.

## 10. Ejecutar las primeras migraciones

Confirmar que `.env` apunta a `almacen_municipal` antes de ejecutar:

```powershell
php artisan migrate
php artisan migrate:status
```

**Resultado esperado:** se crean las tablas técnicas del proyecto, como usuarios y sesiones, además de las migraciones instaladas por Sanctum. Todavía no habrá tablas documentales hasta escribir sus migraciones.

Laravel utiliza por defecto `App\Models\User` y la tabla `users`. El término “usuarios” del plan es conceptual: puede conservarse la convención de Laravel para evitar personalizaciones innecesarias. No crear una segunda tabla `usuarios` sin decidir cómo se integrará con la autenticación.

Si las migraciones predeterminadas de la versión instalada no incluyeran sesiones, comprobar primero su contenido y generar la migración faltante con `php artisan make:session-table`; después ejecutar `php artisan migrate`. No generar dos tablas iguales.

### Comprobar la conexión real desde Laravel

```powershell
php artisan tinker
```

Dentro de Tinker:

```php
DB::select('SELECT DATABASE() AS base_actual, VERSION() AS version_servidor');
```

Debe mostrar `almacen_municipal` y la versión de MySQL esperada. Salir con `exit`.

No ejecutar `migrate:fresh` como rutina: elimina las tablas. Para cambios posteriores se escribirán nuevas migraciones.

## 11. Crear una ruta para comprobar la API

Abrir `C:\xampp\htdocs\ALMACEN-BACKEND\routes\api.php`.

Conservar las importaciones existentes y agregar las que falten. Añadir una ruta de diagnóstico básico sin exponer credenciales ni detalles de configuración:

```php
<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Integrar esta ruta en el archivo existente, sin duplicar <?php ni imports.
Route::prefix('v1')->group(function (): void {
    Route::get('/estado', function () {
        DB::select('SELECT 1');

        return response()->json([
            'ok' => true,
            'servicio' => 'Archivo Municipal API',
        ]);
    });
});
```

Laravel agrega `/api` a estas rutas. Por eso la dirección resultante será **`/api/v1/estado`**, no `/api/api/v1/estado`.

Verificar su registro:

```powershell
php artisan route:list --path=api
```

Esta ruta comprueba la conexión SQL y la ejecución de Laravel. No comprueba permisos, tablas documentales ni el funcionamiento completo del sistema. En producción se revisará la política de acceso a diagnósticos y no se expondrán excepciones detalladas.

## 12. Iniciar el backend para desarrollo

Abrir una terminal en `C:\xampp\htdocs\ALMACEN-BACKEND` y ejecutar:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

Dejar esa terminal abierta. En el navegador visitar:

```text
http://127.0.0.1:8000/api/v1/estado
```

Respuesta esperada:

```json
{
  "ok": true,
  "servicio": "Archivo Municipal API"
}
```

También se puede comprobar desde otra terminal:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/estado"
```

`php artisan serve` es para desarrollo, no el servidor definitivo de la municipalidad. Para esta prueba Laravel no necesita que Apache de XAMPP esté iniciado; MySQL sí debe estar funcionando.

## 13. Conectar React mediante el proxy de Vite

El proyecto React permanece en **`C:\xampp\htdocs\ALMACEN`**. No ejecutar sus comandos npm desde `ALMACEN-BACKEND`.

Abrir `ALMACEN\vite.config.ts`. En el objeto `server.proxy` existente, agregar `/api` y `/sanctum`. El bloque propuesto, conservando temporalmente el receptor de demostración, es:

```ts
server: {
  host: '127.0.0.1',
  port: 5173,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    },
    '/sanctum': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    },
    '/demo-api': {
      target: 'http://127.0.0.1',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/demo-api/, '/ALMACEN/api/demo.php'),
    },
  },
},
```

Integrar solo este bloque, preservando plugins y alias del archivo. No agregar `rewrite` a `/api`: Laravel necesita recibir ese prefijo.

El proxy `/demo-api` conserva la configuración previa para la transición. No se usa en esta comprobación inicial y el receptor antiguo no responderá si Apache está detenido. Antes de reactivar Apache, aplicar la protección de carpetas descrita al inicio. Retirar el proxy de demostración cuando su flujo ya esté migrado a Laravel.

### Iniciar React en otra terminal

```powershell
Set-Location -LiteralPath "C:\xampp\htdocs\ALMACEN"
npm run dev
```

No es necesario reinstalar las dependencias del frontend si ya están disponibles. Ante una instalación nueva, ejecutar `npm ci` desde esta carpeta.

Visitar:

```text
http://127.0.0.1:5173/api/v1/estado
```

Debe aparecer el mismo JSON que en el puerto 8000. Esto confirma el recorrido:

```text
Navegador → Vite → Laravel → MySQL
```

React podrá usar rutas relativas:

```ts
const response = await fetch('/api/v1/estado', {
  headers: { Accept: 'application/json' },
  credentials: 'include',
})

if (!response.ok) throw new Error('No se pudo contactar con el backend')

const result = await response.json()
```

Con este proxy, el navegador utiliza un mismo origen. No hace falta agregar una configuración CORS abierta ni instalar paquetes CORS antiguos. El proxy de Vite existe solo durante desarrollo: el servidor definitivo necesitará su propia configuración equivalente.

## 14. Implementar el login como primer módulo

Después de que funcione `/api/v1/estado`, el siguiente objetivo es conectar `LoginPage.tsx`.

### Archivos iniciales sugeridos

Ejecutar en `ALMACEN-BACKEND`:

```powershell
php artisan make:controller Api/V1/AuthController
php artisan make:request Auth/LoginRequest
php artisan make:migration add_access_fields_to_users_table --table=users
php artisan make:test Auth/LoginTest
```

Estos comandos crean archivos base, no una autenticación terminada. Completar su contenido antes de migrar o dar por aprobado el módulo.

### Funciones que deben implementarse

| Endpoint | Función |
|---|---|
| `POST /api/v1/auth/login` | Validar credenciales, cuenta activa y regenerar la sesión |
| `GET /api/v1/auth/me` | Devolver usuario actual y ámbito autorizado, protegido con `auth:sanctum` |
| `POST /api/v1/auth/logout` | Cerrar sesión, invalidarla y regenerar CSRF |

Agregar un limitador para intentos de login. Inicialmente se crearán usuarios mediante un procedimiento de administración, no registro público libre.

Para las sesiones SPA, utilizar el guard web, Sanctum stateful y CSRF. El middleware debe inicializar la sesión también en el endpoint de login. Tener Sanctum instalado no sustituye la implementación de este controlador.

### Secuencia desde React

1. Solicitar `GET /sanctum/csrf-cookie` con credenciales.
2. Leer la cookie `XSRF-TOKEN`, decodificar su valor y enviarlo como `X-XSRF-TOKEN` en solicitudes que modifican datos.
3. Enviar `POST /api/v1/auth/login` con correo y contraseña.
4. Consultar `GET /api/v1/auth/me`.
5. Mostrar la pantalla del archivo cuando la sesión esté confirmada.
6. Manejar `401` y `419` para sesión ausente o CSRF vencido.

Con `fetch`, el encabezado XSRF no se agrega automáticamente. Centralizar esta lógica en `src/services/apiClient.ts` y conservar el control de errores. La cookie de sesión será `HttpOnly`; no se lee desde JavaScript. No guardar tokens en `localStorage` ni `sessionStorage`.

**Prueba de aceptación:** una solicitud sin sesión a `/auth/me` devuelve `401`; después del login devuelve al usuario correcto y el cierre de sesión vuelve a impedir el acceso.

## 15. Orden de desarrollo después del login

No crear todos los controladores vacíos de una vez. Completar y probar cada módulo antes de integrar el siguiente.

| Orden | Módulo | Trabajo y resultado esperado |
|---|---|---|
| 1 | Usuarios y áreas | Cuenta activa, perfil, área de custodia y políticas de acceso |
| 2 | Ubicaciones | Estantes, módulos y niveles persistentes, con claves foráneas |
| 3 | Catálogos | Tipos documentales y áreas de origen |
| 4 | Expedientes | Registro, edición, IDs permanentes, código único y validaciones |
| 5 | Movimientos | Actualización de ubicación e historial en una transacción |
| 6 | Consulta y etiquetas | Búsqueda central, paginación, selección entre páginas y QR |
| 7 | Digitalización | Sesiones, vinculación temporal, cargas privadas, orden y recuperación |
| 8 | Levantamiento | Jornadas y registros persistentes; totales por unidad |
| 9 | Reportes | Consultas y exportaciones con permisos |
| 10 | Operación | Respaldos, restauración, HTTPS, procesos y pruebas reales |

Ejemplo de generación de archivos para el módulo Expedientes, cuando corresponda:

```powershell
php artisan make:model Expediente -m
php artisan make:controller Api/V1/ExpedienteController --api --model=Expediente
php artisan make:request StoreExpedienteRequest
php artisan make:request UpdateExpedienteRequest
php artisan make:resource ExpedienteResource
php artisan make:policy ExpedientePolicy --model=Expediente
php artisan make:test ExpedientesTest
```

Después hay que escribir campos, relaciones, reglas, consultas y pruebas. El comando `make:model -m` no diseña la tabla automáticamente.

Antes de fijar las migraciones del dominio, confirmar si el encargado será de **Abastecimiento** o del **Archivo Central**, y aprobar la nomenclatura de códigos. Las reglas completas están en `planbackend.md`.

## 16. Pruebas y comprobaciones

### En el backend

```powershell
php artisan route:list
php artisan migrate:status
composer check-platform-reqs
```

Para ejecutar pruebas:

```powershell
php artisan test
```

Antes de introducir pruebas con `RefreshDatabase` o migraciones automáticas, configurar un entorno de pruebas aislado. La configuración predeterminada puede usar SQLite en memoria; las pruebas de integridad y concurrencia del proyecto deben ejecutarse también con una base MySQL de pruebas y credenciales que no permitan modificar `almacen_municipal`.

El directorio de imágenes de pruebas también debe ser independiente. Nunca ejecutar pruebas destructivas sobre documentos municipales.

### En el frontend

```powershell
Set-Location -LiteralPath "C:\xampp\htdocs\ALMACEN"
npm run build
npm run lint
```

Las pruebas actuales de memoria esperan que los datos se reinicien al recargar. Al migrar a Laravel, actualizarlas para comprobar persistencia y utilizar datos de prueba preparados mediante el backend.

### Primera entrega completa

Comprobar este recorrido con dos sesiones autorizadas:

> Login → registrar expediente → recargar → buscarlo desde otra computadora → consultar ubicación e historial → imprimir QR.

Después agregar la captura móvil y comprobar que los reintentos no duplican páginas y que volver a entrar recupera imágenes y orden.

## 17. Cómo iniciar el trabajo cada día

### Servicio de MySQL

Verificar que el servicio MySQL de Windows esté iniciado y use el puerto configurado. El botón MySQL de XAMPP puede corresponder a MariaDB, no al servidor MySQL instalado por esta guía.

### Terminal 1 — Backend

```powershell
Set-Location -LiteralPath "C:\xampp\htdocs\ALMACEN-BACKEND"
php artisan serve --host=127.0.0.1 --port=8000
```

### Terminal 2 — Frontend

```powershell
Set-Location -LiteralPath "C:\xampp\htdocs\ALMACEN"
npm run dev
```

Abrir `http://127.0.0.1:5173`.

No repetir `composer create-project`, `key:generate` ni la creación SQL cada día. En futuras instalaciones desde un proyecto existente se usa `composer install`, respetando `composer.lock`.

Las colas y tareas programadas se incorporarán cuando existan trabajos que las necesiten. No son requisito para verificar el primer endpoint.

## 18. Publicación posterior en la red municipal

Esta guía de arranque utiliza servidores locales enlazados a `127.0.0.1`; otros equipos no podrán entrar todavía. Para la puesta en servicio:

1. Elegir servidor, IP reservada y nombre DNS interno.
2. Configurar HTTPS confiable en computadoras y celulares.
3. Utilizar Apache u otro servidor de producción con PHP compatible. El PHP CLI nuevo no cambia por sí solo el módulo PHP de XAMPP.
4. Publicar React compilado y enrutar `/api` y `/sanctum` hacia Laravel bajo el mismo origen.
5. Exponer solamente `ALMACEN-BACKEND/public` y bloquear el acceso a la raíz desde cualquier sitio predeterminado de Apache.
6. Configurar las rutas de React para que `/archivo` y `/levantamiento` puedan abrirse directamente sin capturar las rutas de la API.
7. Cambiar `APP_ENV`, `APP_DEBUG`, `APP_URL`, cookies y dominios stateful a sus valores reales.
8. Configurar permisos de escritura para `storage` y `bootstrap/cache`.
9. Mantener fotografías en almacenamiento privado; no crear un enlace público para documentos protegidos.
10. Programar respaldo de MySQL y fotografías en otro destino y probar restauración.
11. Comprobar conectividad del Wi-Fi del celular hacia el servidor y acceso autorizado por área.
12. Verificar cámara, lectura QR, carga de imágenes y recuperación tras recarga.

No usar `npm run dev` ni `php artisan serve` como despliegue definitivo. El navegador del celular no debe usar `localhost` para llegar a la computadora: utilizará el nombre interno real del servidor.

## 19. Problemas frecuentes

| Problema | Qué revisar |
|---|---|
| `php` no se reconoce | PATH, nueva terminal y `Get-Command php` |
| PHP sigue en 8.2 | Precedencia en PATH; comparar `where.exe php` y `php --ini` |
| `composer` no se reconoce | Instalar Composer, reabrir editor y terminal |
| Requisito PHP incompatible | Utilizar PHP 8.4 con Laravel 13; no ignorar requisitos |
| Falta `zip`, `fileinfo` o `pdo_mysql` | Editar el `php.ini` cargado por el PHP que utiliza Composer/Artisan |
| Error de certificado de Composer | Corregir certificados de confianza, sin desactivar TLS |
| `Project directory ... is not empty` | Verificar que no haya instalación previa; no borrar archivos sin revisar |
| `Could not open input file: artisan` | Laravel no está instalado o la terminal está en ALMACEN y no en ALMACEN-BACKEND |
| `could not find driver` | Habilitar `pdo_mysql` en el PHP CLI correcto |
| Conexión SQL rechazada | Servicio MySQL, host y puerto 3307 del ejemplo |
| `Access denied` de MySQL | Usuario, contraseña, permisos y coincidencia con `127.0.0.1` |
| `Unknown database` | Crear la base en el servidor MySQL al que conecta Laravel |
| Falta tabla `sessions` | Revisar y ejecutar migraciones sobre la base correcta |
| `.env` parece ignorado | Ejecutar `php artisan config:clear` y reiniciar el proceso de desarrollo |
| `404` en `/api/v1/estado` | `install:api`, registro de `routes/api.php`, prefijo y `route:list` |
| HTML de React en lugar de JSON | Proxy `/api` ausente o Vite sin reiniciar |
| `502` o `ECONNREFUSED` del proxy | Laravel no está escuchando en el puerto 8000 |
| `419` al iniciar sesión | CSRF, cookie XSRF, encabezado X-XSRF-TOKEN, dominio y credenciales |
| `401` después del login | Sesión, middleware stateful y host coherente entre frontend/backend |
| Las imágenes demo no responden | Apache antiguo detenido o proxy demo; no confundirlo con la API nueva |
| Cámara bloqueada en celular | HTTPS confiable, permiso de cámara y acceso al nombre interno |

## 20. Lista de avance

- [x] Crear `C:\xampp\htdocs\ALMACEN-BACKEND` como carpeta independiente.
- [x] Documentar la instalación en `ALMACEN\pasos.md`.
- [ ] Preparar PHP 8.4 y comprobar extensiones.
- [ ] Instalar Composer y comprobarlo.
- [ ] Instalar MySQL y verificar versión y puerto del servidor real.
- [ ] Crear base de datos y usuario de desarrollo.
- [ ] Instalar Laravel 13 dentro de la carpeta independiente.
- [ ] Preparar `.env` y clave de aplicación.
- [ ] Instalar Sanctum y habilitar SPA stateful.
- [ ] Ejecutar migraciones y verificar conexión MySQL.
- [ ] Crear y comprobar `/api/v1/estado`.
- [ ] Conectar el proxy de React.
- [ ] Implementar autenticación y áreas autorizadas.
- [ ] Desarrollar los módulos en el orden del plan.
- [ ] Configurar despliegue interno, HTTPS y respaldos.

## 21. Fuentes oficiales

Documentación consultada para preparar esta guía:

- Instalación de Laravel 13: <https://laravel.com/docs/13.x/installation>
- Requisitos y despliegue: <https://laravel.com/docs/13.x/deployment>
- Sanctum y autenticación SPA: <https://laravel.com/docs/13.x/sanctum>
- PHP para Windows: <https://windows.php.net/download/>
- Composer: <https://getcomposer.org/download/>
- MySQL Community Server: <https://dev.mysql.com/downloads/mysql/>

**Siguiente acción concreta:** preparar PHP 8.4 y Composer. La carpeta del backend ya está creada; no hay que crearla nuevamente.

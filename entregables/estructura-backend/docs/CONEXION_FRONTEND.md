# Conectar React con el backend separado

Los proyectos se comunican por HTTP. React no importa archivos PHP ni conoce
las credenciales de MySQL. El backend se inicia desde su propia carpeta.

## Desarrollo local

Desde `C:\xampp\htdocs\ALMACEN-BACKEND`, con PHP disponible:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

Usar la configuración de base existente. La ruta
`http://127.0.0.1:8000/api/v1/estado` requiere que esa conexión funcione.
No es necesario reinstalar Laravel ni generar otra clave de aplicación.

## Cambio futuro en Vite

Añadir la entrada siguiente al objeto `server.proxy` de `vite.config.ts`,
conservando la entrada `/demo-api` actual:

```ts
'/api': {
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
},
```

Después de reiniciar Vite, se podrá probar desde React:

```ts
const response = await fetch('/api/v1/estado', {
  headers: { Accept: 'application/json' },
})
if (!response.ok) throw new Error('No se pudo consultar el backend')
const estado = await response.json()
```

Este ejemplo comprueba conexión; no implementa autenticación ni persistencia
de expedientes. Para Sanctum, completar configuración de dominios, sesión,
rutas de autenticación, proxy y encabezado CSRF antes de conectar operaciones
que modifican datos. Seguir el contrato de acceso de los planes existentes.

El proxy de Vite solo existe durante desarrollo. El despliegue deberá dirigir
las rutas API al backend y servir Laravel exclusivamente desde `public/`.

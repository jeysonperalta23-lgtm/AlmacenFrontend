# Almacén App

Aplicación web desarrollada con **React + TypeScript + Tailwind CSS + Vite**.

## 🚀 Inicio rápido

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior
- npm v9 o superior

### Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en [http://localhost:5173](http://localhost:5173)

## 📜 Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Ejecuta ESLint |

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── archive/       # Formularios, tablas, mapa y panel del archivo central
│   ├── inventory/     # Registro físico y tabla de inventario
│   └── layout/        # Layout compartido
├── hooks/             # Custom hooks de React
├── pages/             # Páginas de la aplicación
│   ├── Archivo/       # Archivo central (/archivo)
│   ├── Inventario/    # Levantamiento físico (/levantamiento)
│   └── Login/         # Acceso (/login y ruta por defecto)
├── services/          # Almacenamiento y comunicación de digitalización
├── types/             # Tipos e interfaces de TypeScript
├── utils/             # Funciones de utilidad
├── App.tsx            # Componente raíz
├── main.tsx           # Punto de entrada
├── index.css          # Estilos globales + Tailwind
└── vite-env.d.ts      # Tipos de Vite para import.meta.env
```

## Mantenimiento

- `src/` contiene el código fuente.
- `node_modules/` contiene las dependencias instaladas; se reconstruye con `npm ci`.
- `dist/` contiene la aplicación compilada; `npm run build` renueva su contenido.
- El archivo `package-lock.json` conserva las versiones de las dependencias para instalaciones reproducibles.
- Los expedientes, estantes, avisos y referencias de digitalización se mantienen únicamente en memoria durante la vida de la página. Al recargar o cerrar la pestaña, se reinician; cada pestaña tiene su propio estado.
- El receptor PHP sigue gestionando las sesiones y fotografías en el servidor. Al recargar la interfaz se pierde la vinculación en memoria con esas capturas.
- Los módulos auxiliares sin consumidores se retiraron; `.env.example` documenta la configuración utilizada por la digitalización.
- La limpieza retiró `RevisionArchivo.tsx`, su CSS y `useArchiveOperations.ts`, que ya no eran necesarios para las pantallas activas. También se eliminaron iconos, estilos y estado de navegación sin uso.
- Los planes y documentos de backend se conservan íntegros como referencia; pueden mencionar componentes retirados. Las utilidades de validación cubiertas por `npm run test:alerts` se mantienen para las pruebas y la futura integración.

## 🛠️ Stack tecnológico

- **React 18** — UI
- **TypeScript** — Tipado estático
- **Tailwind CSS** — Estilos utilitarios
- **Vite** — Bundler ultrarrápido

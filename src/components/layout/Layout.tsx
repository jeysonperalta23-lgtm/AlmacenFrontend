import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

/**
 * Layout principal de la aplicación.
 * Envuelve el contenido con header, sidebar o footer según necesites.
 */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Almacén</h1>
          <nav className="space-x-4 text-sm text-gray-600">
            <a href="/" className="hover:text-blue-600 transition-colors">Inicio</a>
            <a href="/levantamiento" className="hover:text-emerald-600 transition-colors text-emerald-700 font-medium">Levantamiento Físico</a>
            <a href="/archivo" className="hover:text-amber-700 transition-colors font-medium text-arc-brass">Archivo Central</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Productos</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Reportes</a>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 py-6 border-t mt-auto">
        © {new Date().getFullYear()} Almacén App
      </footer>
    </div>
  )
}

import LoginPage from './pages/Login/LoginPage'
import LevantamientoPage from './pages/Inventario/LevantamientoPage'
import ArchivoCentral from './pages/Archivo/ArchivoCentral'
import CapturaMovil from './pages/Archivo/CapturaMovil'

function App() {
  const captureSession = new URLSearchParams(window.location.search).get('captura')
  if (captureSession) return <CapturaMovil sessionId={captureSession} />
  const path = window.location.pathname.replace(/\/$/, '') || '/'

  // Enrutamiento básico manual
  if (path === '/levantamiento') {
    return <LevantamientoPage />
  }

  if (path === '/archivo') {
    return <ArchivoCentral />
  }

  // Por defecto (o en /login) muestra el Login
  return <LoginPage path={path} />
}

export default App

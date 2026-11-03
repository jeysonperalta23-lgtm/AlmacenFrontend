import { FormEvent, useState } from 'react'

interface LoginPageProps {
  path: string
}

export default function LoginPage({ path }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-900 sm:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[3rem] border-emerald-400/20" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border-[4rem] border-lime-300/10" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-lime-300">Almacen</p>
            <h1 className="mt-16 max-w-md text-5xl font-semibold leading-[1.05] tracking-tight">
              Jeyson.
            </h1>
            <p className="mt-6 max-w-sm text-lg leading-8 text-emerald-100/75">
              Gestiona existencias, productos y movimientos con una vista clara de tu operacion.
            </p>
          </div>
          <p className="relative text-sm text-emerald-100/60">Control simple para equipos que hacen que las cosas pasen.</p>
        </section>

        <section className="flex items-center px-6 py-12 sm:px-14 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Almacen</p>
            </div>
            <p className="text-sm font-medium text-emerald-700">Bienvenido de nuevo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Inicia sesion</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Accede a tu panel para continuar con tu trabajo.</p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">Correo electronico</label>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="password">Contrasena</label>
                  <button className="text-xs font-semibold text-emerald-700 hover:text-emerald-900" type="button">¿La olvidaste?</button>
                </div>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa tu contrasena"
                  required
                  type="password"
                  value={password}
                />
              </div>
              <button className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20" type="submit">
                Entrar al panel
              </button>
              {submitted && (
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
                  El formulario esta listo para conectarse con el servicio de autenticacion.
                </p>
              )}
            </form>

            <p className="mt-8 text-center text-xs text-slate-400">Ruta actual: {path === '/login' ? '/login' : '/'}</p>
          </div>
        </section>
      </div>
    </main>
  )
}
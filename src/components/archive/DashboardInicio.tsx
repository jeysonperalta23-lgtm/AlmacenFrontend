import { Expediente, Estructura } from '../../types/archive'
import './DashboardInicio.css'
import { ArchiveOperations } from '../../utils/archiveAlerts'

/* ══════════════ DATA ESTÁTICA ══════════════ */

const HISTORIA = [
  { dato: 'La Municipalidad fue fundada a principios del siglo XX y su primer registro oficial de archivo data de 1923, preservando actas de sesión en pergamino.', icon: '📜' },
  { dato: 'En la década de 1970, el archivo sufrió una inundación que dañó parte de los expedientes. Desde entonces se implementó la política de duplicación de documentos vitales.', icon: '🏛️' },
  { dato: 'El acervo histórico municipal contiene más de 5,000 documentos físicos que datan desde 1923 hasta la actualidad, incluyendo ordenanzas, contratos y actas de sesión.', icon: '📚' },
]

const CONSEJOS = [
  '💡 El código de etiqueta se genera automáticamente. Solo edítalo si es estrictamente necesario.',
  '💡 El campo "Tomo" convierte números automáticamente (ej: escribir "2" → "II").',
  '💡 Usa la pestaña "Explorar" para localizar un documento antes de registrar uno nuevo y evitar duplicados.',
  '💡 Puedes configurar los módulos y áreas de cada estante desde el botón ⚙️ en la pestaña "Registrar".',
]

/* ══════════════ HELPERS ══════════════ */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatDate() {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).replace(/^\w/, c => c.toUpperCase())
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function calcAreaStats(archivos: Expediente[]) {
  const counts: Record<string, number> = {}
  for (const a of archivos) {
    counts[a.modulo] = (counts[a.modulo] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
}

function calcEstanteStats(archivos: Expediente[], estructura: Estructura) {
  const counts: Record<string, number> = {}
  for (const key of Object.keys(estructura)) counts[key] = 0
  for (const a of archivos) counts[a.estante] = (counts[a.estante] ?? 0) + 1
  return Object.entries(counts).map(([key, val]) => ({
    key, label: `Estante ${key}`, count: val,
    modulos: (estructura[key] ?? []).join(', '),
  }))
}

function calcAnioStats(archivos: Expediente[]) {
  const counts: Record<string, number> = {}
  for (const a of archivos) {
    if (a.anio) counts[a.anio] = (counts[a.anio] ?? 0) + 1
  }
  return Object.entries(counts).sort((a, b) => +b[0] - +a[0]).slice(0, 5)
}

function getRecientes(archivos: Expediente[]) {
  return [...archivos].reverse().slice(0, 6)
}

function countThisMonth(archivos: Expediente[]) {
  const now = new Date()
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return archivos.filter(a => a.fecha?.startsWith(prefix)).length
}

/* ══════════════ SUB-COMPONENTES ══════════════ */

type StatVariant = 'red' | 'olive' | 'brass' | 'paper';

const STAT_BG: Record<StatVariant, string> = {
  red: 'bg-gradient-to-br from-arc-red to-arc-redDark text-white',
  olive: 'bg-gradient-to-br from-arc-olive to-[#3A4E33] text-white',
  brass: 'bg-gradient-to-br from-arc-brass to-arc-brassDark text-white',
  paper: 'bg-arc-paper text-arc-ink',
};

function StatCard({ label, value, sub, variant, icon }: {
  label: string, value: string | number, sub?: string, variant: StatVariant, icon: string
}) {
  const light = variant !== 'paper';
  return (
    <div className={`rounded-2xl p-5 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300 cursor-default dash-stat ${STAT_BG[variant]}`}>
      <span className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-[26px] dash-stat__icon">
        {icon}
      </span>
      <div>
        <p className={`text-[11px] font-bold uppercase tracking-widest m-0 mb-0.5 ${light ? 'text-white/75' : 'text-arc-inkSoft'}`}>{label}</p>
        <p className="text-[32px] font-black font-serif leading-none m-0">{value}</p>
        {sub && <p className={`text-[12px] m-0 mt-1 ${light ? 'text-white/65' : 'text-arc-inkSoft'}`}>{sub}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-serif font-bold text-[18px] text-arc-ink m-0 mb-4 flex items-center gap-2">
      {children}
    </h3>
  )
}

/* ══════════════ COMPONENTE PRINCIPAL ══════════════ */

interface DashboardInicioProps {
  archivos: Expediente[]
  estructura: Estructura
  onGoToRegistrar: () => void
  onGoToBuscar: () => void
  onDigitalizar: (id: string) => void
  photoCounts: Record<string, number>
  operations: ArchiveOperations
}

export default function DashboardInicio({ archivos, estructura, onGoToRegistrar, onGoToBuscar, onDigitalizar, photoCounts, operations }: DashboardInicioProps) {
  const historiaHoy = getRandomItem(HISTORIA)
  const consejo = getRandomItem(CONSEJOS)
  const areaStats = calcAreaStats(archivos)
  const estanteStats = calcEstanteStats(archivos, estructura)
  const anioStats = calcAnioStats(archivos)
  const recientes = getRecientes(archivos)
  const maxArea = areaStats[0]?.[1] ?? 1
  const maxAnio = anioStats[0]?.[1] ?? 1
  const totalEste = countThisMonth(archivos)
  const totalEstantes = Object.keys(estructura).length
  const maxEstante = estanteStats.reduce((a, b) => b.count > a.count ? b : a, estanteStats[0] ?? { key: '-', label: '-', count: 0, modulos: '' })

  return (
    <div className="space-y-8 pb-8">

      {/* ── Saludo Dinámico ── */}
      <div className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative dash-hero">
        {/* Círculos decorativos */}
        <div className="arc-circle-deco bg-arc-brass/10 w-[280px] h-[280px] -right-[60px] -top-20" />
        <div className="arc-circle-deco bg-arc-red/15 w-[160px] h-[160px] right-[100px] -bottom-[60px]" />

        <div className="relative z-10">
          <p className="text-[13px] font-medium m-0 mb-1 uppercase tracking-widest text-white/55">{formatDate()}</p>
          <h2 className="font-serif text-[28px] md:text-[34px] font-black text-white m-0 leading-tight">
            {getGreeting()}, <span className="text-arc-brass">Encargado</span>
          </h2>
          <p className="text-[15px] m-0 mt-2 text-white/65">
            {archivos.length === 0
              ? 'El archivo central está listo para recibir tus registros.'
              : `Tienes ${archivos.length} expediente${archivos.length !== 1 ? 's' : ''} en el sistema. ${totalEste > 0 ? `${totalEste} registrado${totalEste !== 1 ? 's' : ''} este mes.` : ''}`}
          </p>
        </div>

        {/* Accesos Rápidos */}
        <div className="flex flex-wrap gap-3 relative z-10">
          <button
            onClick={onGoToRegistrar}
            className="text-white font-bold text-[14px] px-5 py-3 rounded-xl border-none cursor-pointer transition-transform hover:-translate-y-0.5 duration-200 flex items-center gap-2 dash-btn-primary"
          >
            📝 Registrar Expediente
          </button>
          <button
            onClick={onGoToBuscar}
            className="font-bold text-[14px] px-5 py-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-2 dash-btn-ghost"
          >
            🗺️ Explorar Archivo
          </button>
        </div>
      </div>

      {/* ── Tarjetas de Estadísticas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Expedientes" value={archivos.length} icon="📁" variant="red" sub="En el sistema" />
        <StatCard label="Este Mes" value={totalEste} icon="📅" variant="olive" sub="Nuevos registros" />
        <StatCard label="Estantes Activos" value={totalEstantes} icon="🗄️" variant="brass" sub="En uso" />
        <StatCard label="Más Activo" value={maxEstante.label || '—'} icon="⚡" variant="paper" sub={`${maxEstante.count} documentos`} />
      </div>

      {/* ── Fila: Bento Grid Principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna derecha */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cápsula Histórica */}
          <div>
            <SectionTitle>🏛️ Historia Municipal</SectionTitle>
            <div className="rounded-2xl p-5 dash-history">
              <span className="text-4xl block mb-3">{historiaHoy.icon}</span>
              <p className="text-[12px] font-black uppercase tracking-widest m-0 mb-2 text-arc-brassDark">¿Sabías que...?</p>
              <p className="text-[14px] leading-relaxed m-0 font-medium text-arc-ink">{historiaHoy.dato}</p>
            </div>
          </div>

          {/* Consejo del Día */}
          <div className="rounded-2xl p-5 dash-tip">
            <p className="text-[12px] font-black uppercase tracking-widest m-0 mb-2 text-arc-oliveDark">💚 Consejo del Sistema</p>
            <p className="text-[13px] leading-relaxed m-0 text-arc-ink">{consejo}</p>
          </div>
        </div>
      </div>

      {/* ── Fila: Gráficos + Actividad ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Distribución por Área */}
        <div className="rounded-2xl p-5 bg-white border-[1.5px] border-arc-ink/10 shadow-sm">
          <SectionTitle>📊 Distribución por Área</SectionTitle>
          {areaStats.length === 0 ? (
            <p className="text-[13px] text-center py-6 text-arc-inkSoft">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {areaStats.map(([area, count]) => {
                const pct = Math.round((count / maxArea) * 100)
                return (
                  <div key={area}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[13px] font-semibold text-arc-ink truncate max-w-[70%]">{area}</span>
                      <span className="text-[12px] font-bold text-arc-inkSoft">{count}</span>
                    </div>
                    <div className="h-2 dash-bar-track">
                      <div className="h-full dash-bar-fill-red" style={{ width: `${pct}%`, borderRadius: 99, transition: 'width 0.6s ease' } as React.CSSProperties} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Distribución por Año */}
        <div className="rounded-2xl p-5 bg-white border-[1.5px] border-arc-ink/10 shadow-sm">
          <SectionTitle>📅 Distribución por Año</SectionTitle>
          {anioStats.length === 0 ? (
            <p className="text-[13px] text-center py-6 text-arc-inkSoft">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {anioStats.map(([anio, count]) => {
                const pct = Math.round((count / maxAnio) * 100)
                return (
                  <div key={anio}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[13px] font-bold text-arc-ink">{anio}</span>
                      <span className="text-[12px] font-bold text-arc-inkSoft">{count} exp.</span>
                    </div>
                    <div className="h-2 dash-bar-track">
                      <div className="h-full dash-bar-fill-olive" style={{ width: `${pct}%`, borderRadius: 99, transition: 'width 0.6s ease' } as React.CSSProperties} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
        <div className="rounded-2xl p-5 bg-white border-[1.5px] border-arc-ink/10 shadow-sm">
          <SectionTitle>🕐 Actividad Reciente</SectionTitle>
          {recientes.length === 0 ? (
            <p className="text-[13px] text-center py-6 text-arc-inkSoft">Sin registros recientes</p>
          ) : (
            <div className="space-y-3">
              {recientes.map((a, i) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[14px] font-bold ${i === 0 ? 'bg-arc-red/15 text-arc-red' : 'bg-arc-paper2 text-arc-inkSoft'}`}>
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-arc-ink m-0 truncate">{a.tipo || 'Expediente'}</p>
                    <p className="text-[11px] m-0 text-arc-inkSoft">{a.modulo} · {a.anio} · {a.fecha}</p>
                    <button className="text-xs text-arc-red font-bold mt-2 rounded bg-arc-paper2 px-2 py-2" onClick={() => onDigitalizar(a.id)} aria-label={`Digitalizar ${a.codigo}`}>📷 {photoCounts[a.id] ? `${photoCounts[a.id]} páginas` : 'Digitalizar'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Capacidad de Estantes ── */}
      <div>
        <SectionTitle>🗄️ Estado de los Estantes</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {estanteStats.map(({ key, label, count, modulos }) => {
            const capacity = operations.capacities[key]
            const pct = capacity?.total > 0 ? Math.round((count / capacity.total) * 100) : 0
            const level = capacity && pct >= capacity.threshold ? 'high' : pct > 40 ? 'mid' : 'low';

            return (
              <div key={key} className="rounded-2xl p-5 bg-white border-[1.5px] border-arc-ink/10 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-[16px] text-arc-ink m-0">{label}</p>
                    <p className="text-[11px] m-0 mt-0.5 truncate max-w-[160px] text-arc-inkSoft">{modulos || 'Sin módulos'}</p>
                  </div>
                  <span className={`text-[12px] font-black px-2.5 py-1 rounded-full ${level === 'high' ? 'bg-arc-red/10 text-arc-red' : level === 'mid' ? 'bg-arc-brass/15 text-arc-brassDark' : 'bg-arc-olive/10 text-arc-olive'}`}>
                    {count} exp.
                  </span>
                </div>
                {/* Termómetro visual */}
                <div className="h-2.5 overflow-hidden dash-bar-track">
                  <div
                    className={level === 'high' ? 'bg-gradient-to-r from-arc-red to-arc-red/60' : level === 'mid' ? 'bg-gradient-to-r from-arc-brass to-arc-brass/60' : 'bg-gradient-to-r from-arc-olive to-arc-olive/60'}
                    style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 99, transition: 'width 0.8s ease' } as React.CSSProperties}
                  />
                </div>
                <p className="text-[11px] m-0 mt-2 text-right text-arc-inkSoft">{capacity?.total > 0 ? `${pct}% · ${count} de ${capacity.total} plazas de expediente` : 'Capacidad sin configurar'}</p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

import { FormEvent, useEffect, useState } from 'react'
import { Expediente, Estructura } from '../../types/archive'
import {
  ArchiveIcon, GridIcon, LayersIcon, DocIcon, CalendarIcon,
  BookmarkIcon, NoteIcon, TagIcon, CheckIcon, UnlockIcon,
} from './icons'


const CURRENT_YEAR = new Date().getFullYear()
const ABASTECIMIENTO = {
  entidad: 'Municipalidad de Pampas de Hospital',
  area: 'Subgerencia de Abastecimiento',
  jurisdiccion: 'Tumbes',
}
const AREAS_ABASTECIMIENTO = [ABASTECIMIENTO.area, 'Abastecimiento']

/* ── Helpers ── */
function slug(str: string) {
  return (str ?? '').toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, '').split(' ').filter(Boolean).map(w => w.slice(0, 3)).join('').slice(0, 6) || 'GEN'
}
function tipoSlug(str: string) {
  return (str ?? '').toUpperCase().split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 4) || 'DOC'
}
function buildCode(m: string, t: string, a: string, to: string) {
  return [slug(m), tipoSlug(t), a, to ? `T${to}` : null].filter(Boolean).join('-')
}
function toRoman(num: string): string {
  const arabic = parseInt(num, 10)
  if (isNaN(arabic) || arabic < 1 || arabic > 3999) return num.toUpperCase()
  const lookup: Record<string, number> = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }
  let roman = '', i = arabic
  for (const j in lookup) { while (i >= lookup[j]) { roman += j; i -= lookup[j] } }
  return roman
}

/* ── Tips contextuales por campo ── */
type FieldKey = 'estante' | 'modulo' | 'nivel' | 'tipo' | 'anio' | 'tomo' | 'obs' | 'codigo' | 'default'

const FIELD_TIPS: Record<FieldKey, { emoji: string; titulo: string; desc: string; color: string }> = {
  default: { emoji: '📋', titulo: 'Bienvenido al Formulario', desc: 'Haz clic en cualquier campo para ver sugerencias y ayuda personalizada.', color: '#26201B' },
  estante: { emoji: '🗄️', titulo: 'Selecciona el Estante', desc: 'El estante es el mueble físico donde guardarás el documento. El sistema tiene 3 estantes disponibles en el área de archivo.', color: '#AD8A50' },
  modulo: { emoji: '📦', titulo: 'Módulo o Área', desc: 'El módulo es la sección específica dentro del estante asignada a cada área administrativa (ej. Contabilidad, RRHH). Puedes agregar nuevos módulos desde ⚙️ Configurar Estantes.', color: '#516B47' },
  nivel: { emoji: '📏', titulo: 'Nivel / Bandeja', desc: 'Indica el número de repisa contando de arriba hacia abajo (ej. "1" es la bandeja superior, "3" es la tercera). Sé preciso para facilitar la búsqueda física.', color: '#AD8A50' },
  tipo: { emoji: '📄', titulo: 'Tipo de Documento', desc: 'Escribe el tipo de documento o elige una sugerencia. Sé descriptivo (ej. "Órdenes de Compra" es mejor que solo "OC"). El sistema usará esto para generar el código.', color: '#A13328' },
  anio: { emoji: '📅', titulo: 'Año del Expediente', desc: `Ingresa el año al que corresponde el documento. El sistema acepta años desde 1980 hasta el año actual (${CURRENT_YEAR}).`, color: '#516B47' },
  tomo: { emoji: '📚', titulo: 'Tomo (Opcional)', desc: '¡Truco! Si escribes un número (ej. "2"), el sistema lo convierte automáticamente a números romanos ("II"). Déjalo vacío si no hay tomo.', color: '#AD8A50' },
  obs: { emoji: '📝', titulo: 'Observaciones', desc: 'Aquí puedes anotar cualquier detalle importante: folios faltantes, estado del documento, documentos relacionados, etc. Esto es opcional pero muy útil para el encargado.', color: '#5B5347' },
  codigo: { emoji: '🏷️', titulo: 'Código de Etiqueta', desc: 'Este código único identifica el expediente físicamente. Se genera de forma automática. Solo debes editarlo manualmente si existe una razón específica para ello.', color: '#A13328' },
}

interface FormExpedienteProps {
  estructura: Estructura
  editingExpediente: Expediente | null
  onSave: (data: Omit<Expediente, 'id' | 'fecha'>) => void
  onCancelEdit: () => void
}

export default function FormExpediente({ estructura, editingExpediente, onSave, onCancelEdit }: FormExpedienteProps) {
  const [estante, setEstante] = useState('1')
  const [modulo, setModulo] = useState(estructura['1']?.[0] ?? '')
  const [nivel, setNivel] = useState('')
  const [tipo, setTipo] = useState('')
  const [anio, setAnio] = useState('')
  const [tomo, setTomo] = useState('')
  const [obs, setObs] = useState('')
  const [area, setArea] = useState(ABASTECIMIENTO.area)
  const [jurisdiccion, setJurisdiccion] = useState(ABASTECIMIENTO.jurisdiccion)
  const [folioDesde, setFolioDesde] = useState('')
  const [folioHasta, setFolioHasta] = useState('')
  const [codigo, setCodigo] = useState('')
  const [codigoTouched, setCodigoTouched] = useState(false)
  const [isCodeUnlocked, setIsCodeUnlocked] = useState(false)
  const [activeField, setActiveField] = useState<FieldKey>('default')
  const [saved, setSaved] = useState(0)
  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(0), 5000)
    return () => window.clearTimeout(timer)
  }, [saved])
  const [validationError, setValidationError] = useState('')

  const isEditing = editingExpediente !== null
  const isAbastecimiento = /\babastecimiento\b/i.test(modulo)
  const tip = FIELD_TIPS[activeField]

  // Calcular progreso del formulario
  const filled = [estante, modulo, nivel, tipo, anio, ...(isAbastecimiento ? [AREAS_ABASTECIMIENTO.includes(area) ? area : '', jurisdiccion] : [])].filter(value => value.trim()).length
  const total = isAbastecimiento ? 7 : 5
  const progress = Math.round((filled / total) * 100)

  useEffect(() => {
    if (editingExpediente) {
      setEstante(editingExpediente.estante); setModulo(editingExpediente.modulo)
      setNivel(editingExpediente.nivel); setTipo(editingExpediente.tipo)
      setAnio(editingExpediente.anio); setTomo(editingExpediente.tomo)
      setObs(editingExpediente.obs); setCodigo(editingExpediente.codigo)
      setArea(editingExpediente.area ?? ABASTECIMIENTO.area)
      setJurisdiccion(editingExpediente.jurisdiccion ?? ABASTECIMIENTO.jurisdiccion)
      setFolioDesde(editingExpediente.folioDesde ?? '')
      setFolioHasta(editingExpediente.folioHasta ?? '')
      setCodigoTouched(true); setIsCodeUnlocked(false)
    }
  }, [editingExpediente])

  useEffect(() => {
    if (!codigoTouched && !isCodeUnlocked) setCodigo(buildCode(modulo, tipo, anio, tomo))
  }, [modulo, tipo, anio, tomo, codigoTouched, isCodeUnlocked])

  function handleEstanteChange(val: string) {
    setEstante(val); const mods = estructura[val] ?? []; setModulo(mods[0] ?? '')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (![codigo, estante, modulo, nivel, tipo, anio].every(value => value.trim()) || !estructura[estante]?.includes(modulo)) {
      setValidationError('Completa todos los campos obligatorios y selecciona un estante y módulo disponibles.')
      return
    }
    if (isAbastecimiento && (!AREAS_ABASTECIMIENTO.includes(area) || !jurisdiccion.trim())) {
      setValidationError('Selecciona un área / unidad disponible y completa la jurisdicción de Abastecimiento.')
      return
    }
    if (isAbastecimiento && (folioDesde || folioHasta) &&
      (!/^\d+$/.test(folioDesde) || !/^\d+$/.test(folioHasta) ||
        !Number.isSafeInteger(Number(folioDesde)) || !Number.isSafeInteger(Number(folioHasta)) ||
        Number(folioDesde) < 1 || Number(folioHasta) < Number(folioDesde))) {
      setValidationError('Indica ambos extremos del rango de folios: números positivos y el folio final mayor o igual al inicial. También puedes dejar ambos vacíos.')
      return
    }
    setValidationError('')
    onSave({ estante, modulo, nivel, tipo, anio, tomo, obs, codigo,
      entidad: ABASTECIMIENTO.entidad,
      area: isAbastecimiento ? area.trim() : undefined,
      jurisdiccion: isAbastecimiento ? jurisdiccion.trim() : undefined,
      folioDesde: isAbastecimiento ? folioDesde || undefined : undefined,
      folioHasta: isAbastecimiento ? folioHasta || undefined : undefined,
    })
    setSaved(Date.now())
    setNivel(''); setTipo(''); setAnio(''); setTomo(''); setObs('')
    setArea(ABASTECIMIENTO.area); setJurisdiccion(ABASTECIMIENTO.jurisdiccion)
    setFolioDesde(''); setFolioHasta('')
    setCodigo(''); setCodigoTouched(false); setIsCodeUnlocked(false)
    setActiveField('default')
  }

  const modulos = estructura[estante] ?? []
  const isActive = (f: FieldKey) => activeField === f

  return (
    <>
      <div className="fexp-card">
        {/* ══ Header con degradado ══ */}
        <div className="px-6 py-7 fexp-header">
          {/* Textura de puntos sobre el gradient */}
          <div className="dots-archivo-sm" />

          {/* Decorativos */}
          <div className="circle-deco bg-white/[0.06] w-[220px] h-[220px] -right-[60px] -top-20" />
          <div className="circle-deco bg-white/[0.04] w-[120px] h-[120px] right-[100px] -bottom-10" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="fexp-header-icon">
                <DocIcon />
              </div>
              <div>
                <h2 className="font-serif font-black text-[24px] text-white m-0 leading-none">
                  {isEditing ? 'Editar Expediente' : 'Nuevo Expediente'}
                </h2>
                <p className="text-[13px] m-0 mt-1 text-white/60">
                  {isEditing ? 'Actualiza los datos del registro seleccionado' : 'Completa los campos para registrar el documento físico'}
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            {!isEditing && (
              <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
                <div className="flex justify-between w-full">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/55">Progreso</span>
                  <span className={`text-[13px] font-black ${progress === 100 ? 'text-green-300' : 'text-white/80'}`}>{progress}%</span>
                </div>
                <div className="bg-white/15 rounded-full h-1.5 w-full overflow-hidden">
                  {/* width es dinámico → style inline justificado aun en Tailwind puro */}
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-gradient-to-r from-green-300 to-green-500' : 'bg-gradient-to-r from-arc-brass to-arc-red'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[11px] text-white/45">{filled} de {total} campos obligatorios</span>
              </div>
            )}
          </div>
        </div>

        {/* ══ Cuerpo: 2 columnas (form + tip panel) ══ */}
        <div className="flex flex-col lg:flex-row">

          {/* ── Formulario ── */}
          <form className="flex-1 p-6 flex flex-col gap-6" onSubmit={handleSubmit}>
            {validationError && <p role="alert" className="text-sm text-arc-red">{validationError}</p>}

            {/* SECCIÓN 1 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-black bg-gradient-to-br from-arc-brass to-arc-brassDark">1</span>
                <h3 className="font-serif text-[17px] font-bold text-arc-ink m-0">Ubicación Física</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Estante */}
                <div className="fexp-field">
                  <div className={`fexp-icon ${isActive('estante') ? 'fexp-icon-active' : ''}`}><ArchiveIcon className="w-5 h-5" /></div>
                  <select
                    className={`fexp-input ${isActive('estante') ? 'fexp-input-active' : ''}`}
                    required
                    value={estante}
                    onChange={e => handleEstanteChange(e.target.value)}
                    onFocus={() => setActiveField('estante')}
                    onBlur={() => setActiveField('default')}
                  >
                    <option value="" disabled>Selecciona un estante</option>
                    {estante && !estructura[estante] && <option value={estante} disabled>Estante {estante} (no disponible)</option>}
                    {Object.keys(estructura).map(n => <option key={n} value={n}>Estante {n}</option>)}
                  </select>
                  <label className={`fexp-label ${isActive('estante') ? 'fexp-label-active' : ''}`}>Estante</label>
                </div>

                {/* Módulo */}
                <div className="fexp-field">
                  <div className={`fexp-icon ${isActive('modulo') ? 'fexp-icon-active' : ''}`}><GridIcon /></div>
                  <select
                    className={`fexp-input ${isActive('modulo') ? 'fexp-input-active' : ''}`}
                    required
                    value={modulo}
                    onChange={e => setModulo(e.target.value)}
                    onFocus={() => setActiveField('modulo')}
                    onBlur={() => setActiveField('default')}
                  >
                    <option value="" disabled>Selecciona un módulo</option>
                    {modulo && !modulos.includes(modulo) && <option value={modulo} disabled>{modulo} (no disponible)</option>}
                    {modulos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <label className={`fexp-label ${isActive('modulo') ? 'fexp-label-active' : ''}`}>Módulo / Área del archivo</label>
                </div>

                {/* Nivel */}
                <div className="fexp-field">
                  <div className={`fexp-icon ${isActive('nivel') ? 'fexp-icon-active' : ''}`}><LayersIcon /></div>
                  <input
                    className={`fexp-input ${isActive('nivel') ? 'fexp-input-active' : ''}`}
                    type="text" placeholder="Ej. 3"
                    value={nivel}
                    onChange={e => setNivel(e.target.value)}
                    onFocus={() => setActiveField('nivel')}
                    onBlur={() => setActiveField('default')}
                    required
                  />
                  <label className={`fexp-label ${isActive('nivel') ? 'fexp-label-active' : ''}`}>Nivel / Bandeja</label>
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="fexp-divider" />

            {/* SECCIÓN 2 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-black bg-gradient-to-br from-arc-red to-arc-redDark">2</span>
                <h3 className="font-serif text-[17px] font-bold text-arc-ink m-0">Detalles del Documento</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isAbastecimiento && (
                  <>
                    <p className="sm:col-span-2 text-sm text-arc-muted m-0">Datos de Abastecimiento. Verifica los valores sugeridos según el documento.</p>
                    <div className="fexp-field sm:col-span-2">
                      <div className="fexp-icon"><GridIcon /></div>
                      <select id="exp-area" className="fexp-input" required value={area} onChange={e => setArea(e.target.value)}>
                        <option value="">Selecciona un área...</option>
                        {area && !AREAS_ABASTECIMIENTO.includes(area) && <option value={area} disabled>{area} (selecciona un área disponible)</option>}
                        {AREAS_ABASTECIMIENTO.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
                      </select>
                      <label htmlFor="exp-area" className="fexp-label">Área / Unidad</label>
                    </div>
                    <div className="fexp-field sm:col-span-2">
                      <div className="fexp-icon"><TagIcon /></div>
                      <input id="exp-jurisdiccion" className="fexp-input" required value={jurisdiccion} onChange={e => setJurisdiccion(e.target.value)} />
                      <label htmlFor="exp-jurisdiccion" className="fexp-label">Ubicación / Jurisdicción</label>
                    </div>
                  </>
                )}
                {/* Tipo */}
                <div className="fexp-field sm:col-span-2">
                  <div className={`fexp-icon ${isActive('tipo') ? 'fexp-icon-active' : ''}`}><DocIcon /></div>
                  <input
                    className={`fexp-input ${isActive('tipo') ? 'fexp-input-active' : ''}`}
                    list="tipos-docs" type="text" placeholder={isAbastecimiento ? 'Ej. Informes' : 'Ej. Órdenes de Compra'}
                    value={tipo}
                    onChange={e => setTipo(e.target.value)}
                    onFocus={() => setActiveField('tipo')}
                    onBlur={() => setActiveField('default')}
                    required
                  />
                  <label className={`fexp-label ${isActive('tipo') ? 'fexp-label-active' : ''}`}>{isAbastecimiento ? 'Tipo de Documento / Contenido' : 'Tipo de Documento'}</label>
                </div>

                {/* Año */}
                <div className="fexp-field">
                  <div className={`fexp-icon ${isActive('anio') ? 'fexp-icon-active' : ''}`}><CalendarIcon /></div>
                  <input
                    className={`fexp-input ${isActive('anio') ? 'fexp-input-active' : ''}`}
                    type="number" placeholder={String(CURRENT_YEAR)} min="1980" max={CURRENT_YEAR}
                    value={anio}
                    onChange={e => setAnio(e.target.value)}
                    onFocus={() => setActiveField('anio')}
                    onBlur={() => setActiveField('default')}
                    required
                  />
                  <label className={`fexp-label ${isActive('anio') ? 'fexp-label-active' : ''}`}>Año</label>
                </div>

                {/* Tomo */}
                <div className="fexp-field">
                  <div className={`fexp-icon ${isActive('tomo') ? 'fexp-icon-active' : ''}`}><BookmarkIcon /></div>
                  <input
                    className={`fexp-input ${isActive('tomo') ? 'fexp-input-active' : ''}`}
                    type="text" placeholder="Ej. II (opcional)"
                    value={tomo}
                    onChange={e => {
                      const upper = e.target.value.toUpperCase()
                      setTomo(/^[0-9]+$/.test(upper) ? toRoman(upper) : upper)
                    }}
                    onFocus={() => setActiveField('tomo')}
                    onBlur={() => setActiveField('default')}
                  />
                  <label className={`fexp-label ${isActive('tomo') ? 'fexp-label-active' : ''}`}>Tomo (Opcional)</label>
                </div>

                {/* Observaciones */}
                {isAbastecimiento && (
                  <fieldset className="sm:col-span-2 min-w-0">
                    <legend className="text-sm font-bold mb-3">Número de Folios — Rango (Opcional)</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="fexp-field">
                        <div className="fexp-icon"><DocIcon /></div>
                        <input id="exp-folio-desde" className="fexp-input" type="text" inputMode="numeric" pattern="[0-9]+" placeholder="Ej. 001" value={folioDesde} onChange={e => setFolioDesde(e.target.value)} />
                        <label htmlFor="exp-folio-desde" className="fexp-label">Folio inicial</label>
                      </div>
                      <div className="fexp-field">
                        <div className="fexp-icon"><DocIcon /></div>
                        <input id="exp-folio-hasta" className="fexp-input" type="text" inputMode="numeric" pattern="[0-9]+" placeholder="Ej. 523" value={folioHasta} onChange={e => setFolioHasta(e.target.value)} />
                        <label htmlFor="exp-folio-hasta" className="fexp-label">Folio final</label>
                      </div>
                    </div>
                    <p className="text-xs mt-2">{folioDesde && folioHasta ? `N° Folios: ${folioDesde} al ${folioHasta}` : 'Puedes dejar ambos campos vacíos si no conoces el rango.'}</p>
                  </fieldset>
                )}
                <div className="relative sm:col-span-2">
                  <textarea
                    className={`fexp-input resize-none min-h-[90px] !pt-3.5 ${isActive('obs') ? 'fexp-input-active' : ''}`}
                    placeholder="Añade observaciones: folios faltantes, estado, referencias... (opcional)"
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    onFocus={() => setActiveField('obs')}
                    onBlur={() => setActiveField('default')}
                  />
                  <div className={`fexp-icon fexp-icon-top ${isActive('obs') ? 'fexp-icon-active' : ''}`}><NoteIcon /></div>
                  <label className={`fexp-label ${isActive('obs') ? 'fexp-label-active' : ''}`}>Observaciones</label>
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="fexp-divider" />

            {/* SECCIÓN 3: Código */}
            <div className="p-5 fexp-code-box">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-arc-ink">
                  <TagIcon />
                  <span className="text-[11px] font-black uppercase tracking-widest text-arc-brassDark">Código de Etiqueta Generado</span>
                </div>
                {!isCodeUnlocked && (
                  <button
                    type="button"
                    onClick={() => setIsCodeUnlocked(true)}
                    onFocus={() => setActiveField('codigo')}
                    className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full transition-all hover:bg-white cursor-pointer text-arc-red bg-white/60 border border-arc-red/20"
                  >
                    <UnlockIcon /> Editar manualmente
                  </button>
                )}
              </div>
              <input
                className={`bg-transparent border-none outline-none w-full font-mono text-4xl font-black tracking-wider transition-colors ${isCodeUnlocked ? 'text-arc-red border-b-2 border-arc-red cursor-text' : 'text-arc-ink cursor-default'}`}
                type="text"
                value={codigo}
                onChange={e => { setCodigo(e.target.value); setCodigoTouched(true) }}
                onFocus={() => setActiveField('codigo')}
                onBlur={() => setActiveField('default')}
                readOnly={!isCodeUnlocked}
                required
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2 flex-wrap">
              <button
                type="submit"
                className={`text-[15px] px-8 py-4 rounded-xl flex items-center gap-2 hover:-translate-y-0.5 flex-1 sm:flex-none justify-center ${saved ? 'btn-archivo-success animate-savedPulse' : 'btn-archivo'}`}
              >
                {isEditing ? '💾 Guardar cambios' : 'Registrar expediente'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="font-bold text-[14px] px-6 py-4 rounded-xl cursor-pointer hover:bg-arc-paper transition-colors bg-white text-arc-ink border-2 border-arc-line"
                  onClick={onCancelEdit}
                >
                  Cancelar
                </button>
              )}
            </div>
            {saved > 0 && <p role="status" className="text-sm text-green-700 m-0 flex items-center gap-2"><CheckIcon /> Expediente guardado correctamente.</p>}
          </form>

          {/* ── Panel de Tips (lateral derecho) ── */}
          <aside className="fexp-tip-panel">
            {/* Tip activo — color dinámico vía variable CSS */}
            <div
              key={activeField}
              className="animate-tipIn bg-white rounded-2xl p-[18px] border-[1.5px]"
              style={{ borderColor: `${tip.color}20`, boxShadow: `0 4px 20px ${tip.color}10`, ['--tip-c' as string]: tip.color } as React.CSSProperties}
            >
              <span className="text-[32px]">{tip.emoji}</span>
              <h4 className="font-bold text-[14px] m-0 mt-2 mb-1" style={{ color: tip.color }}>{tip.titulo}</h4>
              <p className="text-[13px] leading-relaxed m-0 text-arc-inkSoft">{tip.desc}</p>
            </div>

            {/* Progreso visual de campos */}
            <div className="bg-white rounded-[14px] p-4 border border-arc-line">
              <p className="text-[11px] font-black uppercase tracking-widest m-0 mb-3 text-arc-inkSoft">Estado del Registro</p>
              {[
                { key: 'estante', label: 'Estante', val: estante },
                { key: 'modulo', label: 'Módulo', val: modulo },
                { key: 'nivel', label: 'Nivel', val: nivel },
                { key: 'tipo', label: 'Tipo de doc.', val: tipo },
                { key: 'anio', label: 'Año', val: anio },
              ].map(({ key, label, val }) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-arc-line last:border-b-0">
                  <span className="text-[12px] text-arc-inkSoft">{label}</span>
                  <div className="flex items-center gap-1.5">
                    {val ? (
                      <>
                        <span className="text-[11px] font-bold text-arc-ink truncate max-w-[80px]">{val}</span>
                        <span className="text-green-600"><CheckIcon /></span>
                      </>
                    ) : (
                      <span className="text-[11px] text-arc-ink/20">Pendiente</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mini tip estático */}
            <div className="rounded-[14px] p-3.5 border border-arc-olive/20 bg-arc-oliveLight">
              <p className="text-[11px] font-black uppercase tracking-widest m-0 mb-1 text-arc-olive">Recuerda</p>
              <p className="text-[12px] leading-relaxed m-0 text-arc-ink">
                Puedes configurar módulos y áreas adicionales desde el botón <b>⚙️ Configurar Estantes</b> arriba en la tabla.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <datalist id="tipos-docs">
        <option value="Órdenes de Compra" /><option value="Facturas" /><option value="Contratos" />
        <option value="Memorandos" /><option value="Informes" /><option value="Resoluciones" />
        <option value="Actas de Sesión" /><option value="Ordenanzas" /><option value="Licitaciones" />
      </datalist>
    </>
  )
}

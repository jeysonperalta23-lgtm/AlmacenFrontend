import { useEffect, useState } from 'react'
import { Expediente } from '../../types/archive'
import MapaEstantes from '../../components/archive/MapaEstantes'
import FormExpediente from '../../components/archive/FormExpediente'
import TablaExpedientes from '../../components/archive/TablaExpedientes'
import ConfigEstantes from '../../components/archive/ConfigEstantes'
import DashboardInicio from '../../components/archive/DashboardInicio'
import Modal from '../../components/archive/Modal'
import Digitalizacion from '../../components/archive/Digitalizacion'
import { PaginaDemo, readDemo } from '../../services/digitalizacionMemory'
import { archivosMemory, estructuraMemory, pendingIdsMemory, highlightedIdsMemory, operationsMemory } from '../../services/archiveMemory'
import { useMemoryState } from '../../hooks/useMemoryState'
import BuscadorEscaner from '../../components/archive/BuscadorEscaner'
import EtiquetadoArchivo from '../../components/archive/EtiquetadoArchivo'
import EscanerExpediente from '../../components/archive/EscanerExpediente'
import ImprimirEtiquetas from '../../components/archive/ImprimirEtiquetas'
import DetalleExpediente from '../../components/archive/DetalleExpediente'
import { scanMatches } from '../../utils/archiveLabels'
import { useMobileScanBridge } from '../../hooks/useMobileScanBridge'
import { ArchiveIcon, EmptyBoxIcon, SettingsIcon, TrashIcon } from '../../components/archive/icons'

type Tab = 'inicio' | 'buscar' | 'registrar'

export default function ArchivoCentral() {
  const [tab, setTab] = useState<Tab>('inicio')
  const [estructura, setEstructura] = useMemoryState(estructuraMemory)
  const [archivos, setArchivos] = useMemoryState(archivosMemory)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [digitalizandoId, setDigitalizandoId] = useState<string | null>(null)
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({})
  const [photoPages, setPhotoPages] = useState<PaginaDemo[]>([])
  const [photoError, setPhotoError] = useState('')
  const [operations] = useMemoryState(operationsMemory)
  const [exploreView, setExploreView] = useState<'labels' | 'map'>('labels')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [mobilePreview, setMobilePreview] = useState(false)
  const [printIds, setPrintIds] = useState<string[]>([])
  const [pendingIds, setPendingIds] = useMemoryState(pendingIdsMemory)
  const [highlightedIds, setHighlightedIds] = useMemoryState(highlightedIdsMemory)
  const [registrationToast, setRegistrationToast] = useState<string | null>(null)
  const pendingCount = pendingIds.filter(id => archivos.some(a => a.id === id)).length
  const scanError = useMobileScanBridge(archivos, id => { setDigitalizandoId(null); setMobilePreview(false); setDetailId(id) })
  useEffect(() => {
    const update = () => {
      try {
        const counts: Record<string, number> = {}
        const store = readDemo()
        const pages = store.pages
        for (const page of pages) counts[page.expedienteId] = (counts[page.expedienteId] || 0) + 1
        setPhotoCounts(counts)
        setPhotoPages(pages)
        setPhotoError('')
        setArchivos(prev => {
          let changed = false
          const next = prev.map(a => {
            const progress = store.digitalizacion?.[a.id]
            const estado = progress?.estado ?? a.estado ?? a.estadoDigital ?? (store.finished.includes(a.id) ? 'FINALIZADO' : undefined)
            const id_sesion = progress?.id_sesion ?? a.id_sesion
            const count = counts[a.id] ?? 0
            if (a.estado === estado && a.estadoDigital === estado && a.id_sesion === id_sesion && a.paginas_capturadas === count) return a
            changed = true
            return { ...a, estado, estadoDigital: estado, id_sesion, paginas_capturadas: count }
          })
          return changed ? next : prev
        })
      } catch {
        setPhotoCounts({}); setPhotoPages([])
        setPhotoError('No se pudo leer el índice en memoria de imágenes digitalizadas.')
      }
    }
    update(); window.addEventListener('demo-updated', update)
    return () => { window.removeEventListener('demo-updated', update) }
  }, [setArchivos])

  useEffect(() => {
    if (!registrationToast) return
    const timer = window.setTimeout(() => setRegistrationToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [registrationToast])
  function acknowledgeRecords(ids: string[]) {
    setHighlightedIds(prev => prev.filter(id => !ids.includes(id)))
  }

  function openExplore(forceLabels = false) {
    if (pendingCount || forceLabels) setExploreView('labels')
    setPendingIds([])
    setRegistrationToast(null)
    setTab('buscar')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSave(data: Omit<Expediente, 'id' | 'fecha'>) {
    if (editingId) {
      setArchivos(prev => prev.map(a => {
        if (a.id !== editingId) return a
        const moved = a.estante !== data.estante || a.modulo !== data.modulo || a.nivel !== data.nivel
        return { ...a, ...data, historialUbicacion: moved ? [...(a.historialUbicacion ?? []), {
          fecha: new Date().toISOString(),
          anterior: { estante: a.estante, modulo: a.modulo, nivel: a.nivel },
          nueva: { estante: data.estante, modulo: data.modulo, nivel: data.nivel },
        }] : a.historialUbicacion }
      }))
      setEditingId(null)
    } else {
      const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      setArchivos(prev => [{
        ...data,
        id,
        fecha: new Date().toISOString().slice(0, 10),
        historialUbicacion: [{ fecha: new Date().toISOString(), nueva: { estante: data.estante, modulo: data.modulo, nivel: data.nivel } }],
      }, ...prev])
      setPendingIds(prev => [...prev, id])
      setHighlightedIds(prev => [...prev, id])
      setRegistrationToast(id)
    }
  }

  function handleEdit(id: string) {
    setEditingId(id); setTab('registrar')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(id: string) {
    setArchivos(prev => prev.filter(a => a.id !== id))
    setPendingIds(prev => prev.filter(value => value !== id))
    setHighlightedIds(prev => prev.filter(value => value !== id))
    setRegistrationToast(prev => prev === id ? null : prev)
  }

  function handleAddEstante() {
    setEstructura(prev => {
      const ids = new Set([...Object.keys(prev), ...archivos.map(a => String(a.estante))])
      const numbers = [...ids].map(Number).filter(n => Number.isSafeInteger(n) && n > 0)
      let next = numbers.reduce((max, n) => Math.max(max, n), 0) + 1
      if (!Number.isSafeInteger(next)) next = 1
      while (ids.has(String(next))) next++
      return { ...prev, [String(next)]: [] }
    })
  }

  function handleAddModulo(estante: string, nombre: string) {
    setEstructura(prev => {
      const mods = prev[estante] ?? []
      if (mods.includes(nombre)) return prev
      return { ...prev, [estante]: [...mods, nombre] }
    })
  }

  function handleRemoveModulo(estante: string, idx: number) {
    setEstructura(prev => {
      const mods = [...(prev[estante] ?? [])]; mods.splice(idx, 1)
      return { ...prev, [estante]: mods }
    })
  }

  function confirmReset() { setArchivos([]); setPendingIds([]); setHighlightedIds([]); setRegistrationToast(null); setIsDeleteOpen(false) }

  const editingExpediente = editingId ? (archivos.find(a => a.id === editingId) ?? null) : null
  const detail = archivos.find(a => a.id === detailId)

  return (
    <>
      <div className="page-archivo">
        {registrationToast && <div className="et-registration-toast" aria-label="Registro exitoso">
          <p role="status">¡Expediente registrado con éxito!</p>
          <div><button type="button" className="et-button et-button-primary" onClick={() => openExplore(true)}>Ir a imprimir QR</button><button type="button" className="et-toast-dismiss" aria-label="Cerrar notificación" onClick={() => setRegistrationToast(null)}>×</button></div>
        </div>}
        <BuscadorEscaner archivos={archivos} onOpen={setDetailId} onMobile={() => setMobilePreview(true)} />
        {scanError && <p className="et-error mx-5 my-3" role="status">{scanError}</p>}
        <header className="header-archivo">
          <div className="dots-archivo" />
          <div className="circle-deco bg-white/[0.06] w-[320px] h-[320px] -right-20 -top-[120px]" />
          <div className="circle-deco bg-white/[0.04] w-[200px] h-[200px] right-[60px] top-10" />

          <div className="relative z-10 max-w-[1040px] mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl text-white glass-archivo-soft">
                <ArchiveIcon />
              </div>
              <div>
                <h1 className="font-serif font-black text-[38px] md:text-[44px] m-0 leading-none text-white drop-shadow-sm">
                  Archivo Central
                </h1>
                <p className="m-0 text-[15px] font-medium mt-1 text-white/75">
                  Municipalidad Distrital · Oficina de Abastecimiento
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-5 flex items-center gap-5 transition-transform hover:scale-105 duration-300 glass-archivo">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl font-serif bg-white text-arc-red shadow-[inset_0_2px_8px_rgba(161,51,40,0.15)]">
                  {archivos.length}
                </div>
                <div className="text-white">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-white/70">Total registrados</p>
                  <p className="m-0 text-[20px] font-bold leading-snug">Expedientes</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(true)}
                title="Configurar Estantes"
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-bold cursor-pointer hover:opacity-80 transition-all glass-archivo-soft text-white border border-white/20"
              >
                <SettingsIcon />
                <span className="hidden md:inline">Configurar Estantes</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex justify-center py-7">
          <div className="tabs-archivo">
            {([
              { key: 'inicio', label: 'Inicio', icon: '🏠' },
              { key: 'buscar', label: 'Explorar', icon: '🗺️' },
              { key: 'registrar', label: 'Registrar', icon: '📝' },
            ] as const).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => key === 'buscar' ? openExplore() : setTab(key)}
                aria-current={tab === key ? 'page' : undefined}
                className={tab === key ? 'tab-archivo-active' : 'tab-archivo'}
              >
                <span>{icon}</span>
                {label}
                {key === 'buscar' && pendingCount > 0 && <span className="et-pending-badge" aria-label={`${pendingCount} nuevos registros pendientes`}>{pendingCount}</span>}
              </button>
            ))}
            <button type="button" className={isConfigOpen ? 'tab-archivo-active' : 'tab-archivo'} aria-haspopup="dialog" aria-expanded={isConfigOpen} onClick={() => setIsConfigOpen(true)}>
              <span aria-hidden="true"><SettingsIcon /></span>
              Configuración
            </button>
          </div>
        </div>

        <div key={tab} className={`animate-tabIn ${tab === 'buscar' ? 'max-w-[1240px]' : 'max-w-[1040px]'} mx-auto px-5 pb-20`}>
          {tab === 'inicio' ? (
            <DashboardInicio
              archivos={archivos}
              estructura={estructura}
              onGoToRegistrar={() => setTab('registrar')}
              onGoToBuscar={() => openExplore()}
              onDigitalizar={setDigitalizandoId}
              photoCounts={photoCounts}
              operations={operations}
            />
          ) : tab === 'buscar' ? (
            <div className="et-explore-layout">
            <nav className="et-view-switch" aria-label="Vista de exploración">
              <button type="button" className={exploreView === 'labels' ? 'is-active' : ''} aria-pressed={exploreView === 'labels'} aria-controls="archive-explore-content" onClick={() => setExploreView('labels')}><span aria-hidden="true">▦</span><span>Etiquetas QR</span></button>
              <button type="button" className={exploreView === 'map' ? 'is-active' : ''} aria-pressed={exploreView === 'map'} aria-controls="archive-explore-content" onClick={() => setExploreView('map')}><span aria-hidden="true">▥</span><span>Mapa de estantes</span></button>
            </nav>
            <div id="archive-explore-content" className="et-explore-content">
            {exploreView === 'labels' ? <EtiquetadoArchivo archivos={archivos} highlightedIds={highlightedIds} onAcknowledge={acknowledgeRecords} onOpen={id => { acknowledgeRecords([id]); setDetailId(id) }} onMobile={() => setMobilePreview(true)} onRegister={() => setTab('registrar')} /> : archivos.length === 0 ? (
              <div className="rounded-3xl flex flex-col items-center justify-center py-24 px-8 text-center bg-white border-2 border-dashed border-arc-brass shadow-[0_8px_30px_rgba(173,138,80,0.08)]">
                <span className="text-arc-brass"><EmptyBoxIcon /></span>
                <h3 className="font-serif text-[26px] font-bold text-arc-ink mt-4 mb-2">Aún no hay expedientes</h3>
                <p className="text-arc-inkSoft text-[16px] mb-8 max-w-md">
                  El archivo central está vacío. Comienza a registrar los documentos físicos para generar sus etiquetas y ubicaciones.
                </p>
                <button
                  onClick={() => setTab('registrar')}
                  className="btn-archivo text-[16px] px-8 py-4 rounded-xl hover:-translate-y-1"
                >
                  ✚ Registrar el primero
                </button>
              </div>
            ) : (
              <MapaEstantes estructura={estructura} archivos={archivos} pages={photoPages} photoError={photoError} onDigitalizar={setDigitalizandoId} />
            )}</div></div>
          ) : (
            <div className="space-y-6">
              <FormExpediente
                estructura={estructura}
                editingExpediente={editingExpediente}
                onSave={handleSave}
                onCancelEdit={() => setEditingId(null)}
              />

              {archivos.length > 0 && (
                <div className="card-archivo p-6">
                  <div className="flex justify-between items-center mb-5 pb-4 border-b border-arc-line">
                    <div>
                      <h2 className="font-serif text-[20px] font-bold text-arc-ink m-0">Últimos registrados</h2>
                      <p className="text-[13px] text-arc-inkSoft mt-0.5 m-0">Mostrando los {Math.min(5, archivos.length)} más recientes · <button onClick={() => openExplore()} className="underline text-arc-red hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer p-0 text-[13px]">Ver todos en Explorar →</button></p>
                    </div>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-arc-paper2 border border-arc-line text-[12px] font-bold text-arc-inkSoft">
                      {archivos.length} total
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <TablaExpedientes
                      archivos={archivos.slice(0, 5)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="max-w-[1040px] mx-auto px-5 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[13px] text-arc-inkSoft border-t border-arc-ink/10">
          <span>Datos guardados localmente en este navegador. Persisten entre sesiones.</span>
          <button
            className="font-bold underline cursor-pointer bg-transparent border-none hover:opacity-70 transition-opacity text-arc-red"
            onClick={() => setIsDeleteOpen(true)}
          >
            Vaciar todo el archivo
          </button>
        </div>
      </div>

      <Modal isOpen={!!detail} onClose={() => setDetailId(null)} variant="detail" title={detail?.codigo || 'Expediente sin código'}>
        {detail && <><DetalleExpediente expediente={detail} paginas={photoCounts[detail.id] || 0} /><div className="et-detail-actions"><button className="et-button et-button-dark" onClick={() => { setDetailId(null); setDigitalizandoId(detail.id) }}>📷 Digitalizar / vincular celular</button><button className="et-button et-button-primary" onClick={() => { setPrintIds([detail.id]); setDetailId(null) }}>▦ Imprimir etiqueta</button><button className="et-button et-button-outline" onClick={() => { setDetailId(null); handleEdit(detail.id) }}>Editar</button></div></>}
      </Modal>
      <Modal isOpen={mobilePreview} onClose={() => setMobilePreview(false)} title="Vista móvil · Prueba el escáner">
        <div className="et-phone-mockup"><div className="et-phone"><EscanerExpediente preview onRead={value => {
          const matches = scanMatches(archivos, value)
          if (!matches.length) throw new Error('Este código no corresponde a un expediente de este navegador.')
          if (matches.length > 1) throw new Error('El código está repetido. Utiliza el QR único del expediente.')
          setMobilePreview(false); setDetailId(matches[0].id)
        }} /></div></div>
      </Modal>
      {printIds.length > 0 && <ImprimirEtiquetas archivos={archivos.filter(a => printIds.includes(a.id))} onClose={() => setPrintIds([])} />}
      {digitalizandoId && archivos.find(a => a.id === digitalizandoId) && <Digitalizacion key={digitalizandoId} expediente={archivos.find(a => a.id === digitalizandoId)!} onClose={() => setDigitalizandoId(null)} />}
      <Modal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="⚙️ Configurar Estantes y Módulos">
        <p className="text-arc-inkSoft text-[14px] mb-5">Administra los módulos y áreas asignadas a cada estante físico del archivo.</p>
        <ConfigEstantes estructura={estructura} onAddEstante={handleAddEstante} onAddModulo={handleAddModulo} onRemoveModulo={handleRemoveModulo} />
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Zona de Peligro">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-arc-red/10 text-arc-red">
            <TrashIcon />
          </div>
          <h4 className="text-[20px] font-bold text-arc-ink mb-2">¿Estás absolutamente seguro?</h4>
          <p className="text-arc-inkSoft mb-8 max-w-sm">
            Esta acción borrará <b>todos los expedientes</b> de manera permanente. Esta operación <b>no se puede deshacer</b>.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 py-3.5 rounded-xl font-bold cursor-pointer hover:opacity-80 transition-opacity bg-arc-paper2 text-arc-ink border-[1.5px] border-arc-ink/15"
            >
              Cancelar
            </button>
            <button
              onClick={confirmReset}
              className="btn-archivo flex-1 py-3.5 rounded-xl hover:opacity-90"
            >
              Sí, borrar todo
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

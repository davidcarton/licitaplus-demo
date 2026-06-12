import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SearchX, WifiOff, Sparkles, Bookmark, BookmarkCheck } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import FiltroBarra from '../components/ui/FiltroBarra.jsx'
import LicitacionCard from '../components/cards/LicitacionCard.jsx'
import LicitacionModal from '../components/cards/LicitacionModal.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import BlueprintFrame from '../components/ui/BlueprintFrame.jsx'
import { tipoBadge } from '../utils/format.js'
import { useApp } from '../context/AppContext.jsx'

export default function Licitaciones() {
  const navigate = useNavigate()
  const { licitacionesGuardadas, guardarLicitacion, quitarLicitacion } = useApp()

  const [licitaciones, setLicitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionada, setSeleccionada] = useState(null)

  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('')
  const [filtroImporte, setFiltroImporte] = useState('')
  const [filtroProvincia, setFiltroProvincia] = useState('')

  const cargarDatos = useCallback(() => {
    fetch('/api/licitaciones')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setLicitaciones(data.licitaciones || [])
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Licitaciones'
    cargarDatos()
    return () => { document.title = tituloPrevio }
  }, [cargarDatos])

  const actualizar = () => {
    setCargando(true)
    setError(null)
    fetch('/api/licitaciones?refresh=1')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setLicitaciones(data.licitaciones || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }

  const provincias = useMemo(() => {
    return [...new Set(
      licitaciones
        .map(l => l.provincia)
        .filter(Boolean)
    )].sort()
  }, [licitaciones])

  const licitacionesFiltradas = useMemo(() => {
    return licitaciones.filter(l => {
      if (l.fechaLimite) {
        const hoy = new Date(); hoy.setHours(0,0,0,0)
        if (new Date(l.fechaLimite + 'T00:00:00') <= hoy) return false
      }
      if (textoBusqueda) {
        const t = textoBusqueda.toLowerCase()
        if (!l.titulo?.toLowerCase().includes(t) && !l.organismo?.toLowerCase().includes(t)) return false
      }
      if (filtroUrgencia && tipoBadge(l.fechaLimite) !== filtroUrgencia) return false
      if (filtroImporte && l.importe != null) {
        const imp = parseFloat(l.importe)
        if (filtroImporte === 'menos50' && imp >= 50000) return false
        if (filtroImporte === '50a200'  && (imp < 50000  || imp >= 200000))  return false
        if (filtroImporte === '200a1m'  && (imp < 200000 || imp >= 1000000)) return false
        if (filtroImporte === 'mas1m'   && imp < 1000000) return false
      }
      if (filtroProvincia && l.provincia !== filtroProvincia) return false
      return true
    })
  }, [licitaciones, textoBusqueda, filtroUrgencia, filtroImporte, filtroProvincia])

  return (
    <DashboardLayout
      title="Licitaciones"
      filtros={(
        <FiltroBarra
          onBuscar={setTextoBusqueda}
          onFiltroUrgencia={setFiltroUrgencia}
          onFiltroImporte={setFiltroImporte}
          onFiltroProvincia={setFiltroProvincia}
          provincias={provincias}
          onActualizar={actualizar}
          cargando={cargando}
        />
      )}
    >
      {cargando && <Spinner />}

      {error && !cargando && (
        <div style={{
          background: 'var(--rojo-bg)',
          border: '1px solid var(--rojo-borde)',
          borderRadius: 'var(--r-lg)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <BlueprintFrame size={36} color="var(--rojo-borde)">
            <WifiOff size={16} color="var(--rojo)" />
          </BlueprintFrame>
          <span style={{ fontSize: 13, color: 'var(--rojo)', fontWeight: 500 }}>
            No se ha podido conectar con el servidor de licitaciones.
            Asegúrate de que el servidor está arrancado e inténtalo de nuevo.
          </span>
        </div>
      )}

      {!cargando && !error && licitacionesFiltradas.length === 0 && (
        <div style={{
          minHeight: 300,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12,
        }}>
          <BlueprintFrame size={96}>
            <SearchX size={36} color="var(--n300)" />
          </BlueprintFrame>
          <span style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: 'var(--n500)' }}>
            No hay licitaciones con estos filtros
          </span>
          <span style={{ fontSize: 13, color: 'var(--n300)' }}>
            Prueba a ampliar la búsqueda o eliminar algún filtro
          </span>
        </div>
      )}

      {!cargando && !error && licitacionesFiltradas.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {licitacionesFiltradas.map((l, i) => {
            const guardada = licitacionesGuardadas.some(g => g.expediente === l.expediente)
            return (
              <motion.div
                key={l.expediente || `${l.titulo}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.035, 0.5) }}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 380 }}
              >
                <LicitacionCard licitacion={l} onClick={() => setSeleccionada(l)} />

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/dashboard/resumen', { state: { licitacion: l } }) }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 12px',
                      borderRadius: 'var(--r-md)',
                      background: '#EAF4EE',
                      color: '#2A5938',
                      border: '1px solid #3D7A4F',
                      fontSize: 12, fontWeight: 700,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <Sparkles size={13} />
                    Resumen IA
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      guardada ? quitarLicitacion(l.expediente) : guardarLicitacion(l)
                    }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 12px',
                      borderRadius: 'var(--r-md)',
                      background: guardada ? 'var(--verde-claro)' : 'var(--n100)',
                      color: guardada ? 'var(--verde)' : 'var(--n500)',
                      border: guardada ? '1px solid var(--g200)' : '1px solid transparent',
                      fontSize: 12, fontWeight: 700,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {guardada ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    {guardada ? 'Guardada' : 'Guardar'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {seleccionada && (
          <LicitacionModal licitacion={seleccionada} onCerrar={() => setSeleccionada(null)} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

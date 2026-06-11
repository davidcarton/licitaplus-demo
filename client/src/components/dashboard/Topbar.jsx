import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, Plus } from 'lucide-react'

export default function Topbar({ title }) {
  return (
    <header
      style={{
        height: 58,
        flexShrink: 0,
        background: '#fff',
        borderBottom: '1px solid var(--n100)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 clamp(1rem, 3vw, 1.75rem)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--n500)',
          fontFamily: 'var(--font-body)',
          flexShrink: 0,
          transition: 'color var(--transition)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--verde)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--n500)')}
      >
        <ArrowLeft size={15} />
        <span className="topbar-volver">Volver a la web</span>
      </Link>

      <div style={{ width: 1, height: 22, background: 'var(--n100)', flexShrink: 0 }} />

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 800,
          color: 'var(--negro)',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </h1>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          aria-label="Notificaciones"
          style={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--gris-fondo)',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--n100)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gris-fondo)')}
        >
          <Bell size={17} color="var(--n500)" />
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--rojo)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
            }}
          >
            3
          </span>
        </button>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--verde-medio)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 'var(--r-md)',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--verde)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--verde-medio)')}
        >
          <Plus size={15} />
          <span className="topbar-nueva-alerta">Nueva alerta</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--verde-claro)',
              color: 'var(--verde)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              flexShrink: 0,
            }}
          >
            CG
          </div>
          <span
            className="topbar-empresa"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--n700)',
              whiteSpace: 'nowrap',
            }}
          >
            Constructora García
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .topbar-empresa, .topbar-volver, .topbar-nueva-alerta { display: none !important; }
        }
      `}</style>
    </header>
  )
}

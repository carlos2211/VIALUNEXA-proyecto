import { useEffect, useRef, useState } from 'react'
import heroImg from './assets/hero.webp'
import { useAppData } from './context/AppDataContext'
import { useAuth } from './context/AuthContext'
import type { Role, View } from './types'
import { AdminView, FleetView, RatesView } from './views/AdminView'
import { SupportView } from './views/admin/SupportView'
import { BookView } from './views/BookView'
import { DashboardView } from './views/client/DashboardView'
import { DriverProfileView } from './views/driver/DriverProfileView'
import { DriverServicesView } from './views/driver/DriverServicesView'
import { LoginView } from './views/LoginView'
import { ProfileView } from './views/ProfileView'

const TABS: Record<Role, { view: View; icon: string; label: string }[]> = {
  cliente: [
    { view: 'book', icon: '📝', label: 'Cotizar y reservar' },
    { view: 'dashboard', icon: '📋', label: 'Mis solicitudes' },
    { view: 'profile', icon: '👤', label: 'Mis datos' },
  ],
  conductor: [
    { view: 'services', icon: '🗓️', label: 'Mis servicios' },
    { view: 'driver', icon: '🚘', label: 'Mis datos y vehículo' },
  ],
  admin: [
    { view: 'admin', icon: '📥', label: 'Solicitudes' },
    { view: 'support', icon: '🛟', label: 'Soporte' },
    { view: 'fleet', icon: '🚘', label: 'Flota' },
    { view: 'rates', icon: '⚙️', label: 'Tarifas' },
  ],
}

const ROLE_LABEL: Record<Role, string> = { admin: 'Administrador', conductor: 'Conductor', cliente: 'Cliente' }

export default function App() {
  const { user, logout } = useAuth()
  const { tickets } = useAppData()
  const openTickets = tickets.filter(t => t.status !== 'Resuelto').length
  const role = user?.role
  // La navegación pertenece a un usuario: al cambiar de sesión se abre la primera pestaña del perfil
  const [nav, setNav] = useState({ owner: '', view: 'book' as View, justCreated: '' })
  const owned = nav.owner === user?.id
  const view = owned ? nav.view : role ? TABS[role][0].view : 'book'
  const justCreated = owned ? nav.justCreated : ''
  const setView = (v: View) => setNav({ owner: user?.id ?? '', view: v, justCreated })
  const firstRender = useRef(true)

  // El CSS depende de body[data-view] (barra de total, hero en móvil, márgenes)
  const dataView = user ? view : 'login'
  useEffect(() => {
    document.body.dataset.view = dataView
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [dataView])

  function onReserved(id: string) {
    setNav({ owner: user?.id ?? '', view: 'dashboard', justCreated: id })
  }

  return (
    <>
      <header>
        <div>
          <div className="brand">
            VIALU<span>NEXA</span>
            <small>DEMO</small>
          </div>
          <small className="tagline">Más que trasladarte, te acompañamos con confianza.</small>
        </div>
        {user && role && (
          <>
            <div className="userbox">
              <span>
                <b>{user.name}</b>
                <small>{ROLE_LABEL[role]}</small>
              </span>
              <button type="button" className="logout" onClick={logout}>
                Salir
              </button>
            </div>
            <nav className="tabs" aria-label="Secciones">
              {TABS[role].map(t => (
                <button
                  key={t.view}
                  type="button"
                  className={view === t.view ? 'active' : undefined}
                  aria-current={view === t.view ? 'page' : undefined}
                  onClick={() => setView(t.view)}
                >
                  <span className="ico" aria-hidden="true">{t.icon}</span>
                  <span>{t.label}</span>
                  {t.view === 'support' && openTickets > 0 && <span className="badge">{openTickets}</span>}
                </button>
              ))}
            </nav>
          </>
        )}
      </header>

      <main>
        <section className="hero branded-hero">
          <div className="hero-copy">
            <span className="eyebrow">VIALUNEXA · TRASLADOS Y CONDUCCIÓN PRIVADA</span>
            <h1>Tu viaje, nuestra responsabilidad.</h1>
            <p>
              Reserva un vehículo con conductor o solicita asistencia para conducir tu propio automóvil. Confianza,
              puntualidad y profesionalismo en cada trayecto.
            </p>
            <span className="pill">Servicio programado · Santiago y zona de cobertura</span>
          </div>
          <img className="hero-art" src={heroImg} alt="Identidad VIALUNEXA, carretera, vehículo y ciudad" />
        </section>

        {/* Solo se montan las vistas del perfil conectado; permanecen montadas para conservar lo escrito */}
        {!user && <LoginView />}
        {role === 'cliente' && (
          <>
            <BookView hidden={view !== 'book'} onReserved={b => onReserved(b.id)} />
            <DashboardView hidden={view !== 'dashboard'} justCreated={justCreated} onNew={() => setView('book')} />
            <ProfileView hidden={view !== 'profile'} />
          </>
        )}
        {role === 'conductor' && (
          <>
            <DriverServicesView hidden={view !== 'services'} onCompleteProfile={() => setView('driver')} />
            <DriverProfileView hidden={view !== 'driver'} />
          </>
        )}
        {role === 'admin' && (
          <>
            <AdminView hidden={view !== 'admin'} />
            <SupportView hidden={view !== 'support'} />
            <FleetView hidden={view !== 'fleet'} />
            <RatesView hidden={view !== 'rates'} />
          </>
        )}
      </main>

      <footer>
        VIALUNEXA · Prototipo demostrativo · Sin pagos, mapas en vivo ni envío real de notificaciones · Información
        almacenada localmente
      </footer>
    </>
  )
}

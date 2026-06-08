import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { Sun, LayoutGrid, Moon, Zap, History } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Morning from './pages/Morning'
import Tracker from './pages/Tracker'
import Evening from './pages/Evening'
import Pulse from './pages/Pulse'
import HistoryPage from './pages/History'

const NAV_ITEMS = [
  { to: '/morning', icon: Sun, label: 'Morning' },
  { to: '/tracker', icon: LayoutGrid, label: 'Tracker' },
  { to: '/evening', icon: Moon, label: 'Evening' },
  { to: '/pulse', icon: Zap, label: 'Pulse' },
  { to: '/history', icon: History, label: 'History' },
]

function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex z-50 border-t border-slate-200/80"
      style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              isActive ? 'text-[#5b5bd6]' : 'text-slate-400'
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function ProtectedLayout({ children }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="min-h-screen bg-surface text-slate-900 pb-20 max-w-lg mx-auto">
      {children}
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { setSession, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/morning" element={<ProtectedLayout><Morning /></ProtectedLayout>} />
        <Route path="/tracker" element={<ProtectedLayout><Tracker /></ProtectedLayout>} />
        <Route path="/evening" element={<ProtectedLayout><Evening /></ProtectedLayout>} />
        <Route path="/pulse" element={<ProtectedLayout><Pulse /></ProtectedLayout>} />
        <Route path="/history" element={<ProtectedLayout><HistoryPage /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/tracker" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

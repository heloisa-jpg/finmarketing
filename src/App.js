import React, { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import NovoLancamento from './pages/NovoLancamento'
import Reembolsos from './pages/Reembolsos'
import Adiantamentos from './pages/Adiantamentos'
import Cartoes from './pages/Cartoes'
import Solicitacoes from './pages/Solicitacoes'
import Relatorio from './pages/Relatorio'
import Usuarios from './pages/Usuarios'
import RH from './pages/RH'
import Layout from './components/Layout'
import './App.css'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [rhAba, setRhAba] = useState('overview')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  const isAdmin = profile && ['ceo', 'adm', 'financeiro'].includes(profile.perfil)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f0f' }}>
      <div className="spinner" />
    </div>
  )

  if (!session) return <Login />

  const pages = {
    dashboard: <Dashboard />,
    lancamentos: <Lancamentos />,
    novo_lancamento: <NovoLancamento />,
    reembolsos: <Reembolsos />,
    adiantamentos: isAdmin ? <Adiantamentos /> : <Dashboard />,
    cartoes: isAdmin ? <Cartoes /> : <Dashboard />,
    solicitacoes: isAdmin ? <Solicitacoes /> : <Dashboard />,
    relatorio: isAdmin ? <Relatorio /> : <Dashboard />,
    usuarios: isAdmin ? <Usuarios /> : <Dashboard />,
    rh: isAdmin ? <RH abaInicial={rhAba} /> : <Dashboard />,
  }

  return (
    <AuthContext.Provider value={{ session, profile, isAdmin, setPage }}>
      <Layout page={page} setPage={setPage} rhAba={rhAba} setRhAba={setRhAba}>
        {pages[page] || <Dashboard />}
      </Layout>
    </AuthContext.Provider>
  )
}

import React, { useState } from 'react'
import { useAuth } from '../App'
import { supabase } from '../supabase'

const MODULOS = [
  {
    key: 'financeiro',
    label: 'Financeiro',
    icon: '◎',
    items: [
      { key: 'dashboard', label: 'Painel', icon: '◼' },
      { key: 'lancamentos', label: 'Despesas', icon: '≡' },
      { key: 'novo_lancamento', label: 'Lançar gasto', icon: '+' },
      { key: 'reembolsos', label: 'Reembolsos', icon: '↩' },
      { key: 'solicitacoes', label: 'Pagamentos', icon: '◎', adminOnly: true },
      { key: 'adiantamentos', label: 'Adiantamentos', icon: '◈', adminOnly: true },
      { key: 'cartoes', label: 'Cartões', icon: '▣', adminOnly: true },
      { key: 'relatorio', label: 'Relatórios', icon: '▦', adminOnly: true },
    ]
  },
  {
    key: 'rh',
    label: 'Recursos Humanos',
    icon: '⊙',
    adminOnly: true,
    items: [
      { key: 'rh', label: 'Visão geral', icon: '◼', rhAba: 'overview' },
      { key: 'rh', label: 'Colaboradores', icon: '⊙', rhAba: 'colaboradores' },
      { key: 'rh', label: 'Ponto', icon: '◷', rhAba: 'ponto' },
      { key: 'rh', label: 'Férias', icon: '◈', rhAba: 'ferias' },
      { key: 'rh', label: 'Desempenho', icon: '▦', rhAba: 'desempenho' },
      { key: 'rh', label: 'Onboarding', icon: '→', rhAba: 'onboarding' },
      { key: 'rh', label: 'Salários', icon: '◎', rhAba: 'salarios' },
      { key: 'rh', label: 'Benefícios', icon: '◉', rhAba: 'beneficios' },
    ]
  },
  {
    key: 'config',
    label: 'Configurações',
    icon: '⊕',
    adminOnly: true,
    items: [
      { key: 'usuarios', label: 'Usuários', icon: '⊕' },
    ]
  },
]

export default function Layout({ children, page, setPage, rhAba, setRhAba }) {
  const { profile, isAdmin } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [openModulos, setOpenModulos] = useState({ financeiro: true, rh: false, config: false })

  const logout = async () => { await supabase.auth.signOut() }
  const toggleModulo = (key) => setOpenModulos(prev => ({ ...prev, [key]: !prev[key] }))

  const isActive = (n) => {
    if (n.rhAba) return page === 'rh' && rhAba === n.rhAba
    return page === n.key
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: collapsed ? 56 : 210,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width .2s', flexShrink: 0, overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '1.25rem .875rem' : '1.25rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', letterSpacing: '-.3px' }}>Central APF</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Grupo APF</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'transparent', color: 'var(--text3)', fontSize: 16, padding: 4, lineHeight: 1, flexShrink: 0 }}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {MODULOS.map(mod => {
            if (mod.adminOnly && !isAdmin) return null
            const isOpen = openModulos[mod.key]
            const moduloAtivo = mod.items.some(i => isActive(i))

            return (
              <div key={mod.key}>
                <button
                  onClick={() => { if (!collapsed) toggleModulo(mod.key) }}
                  title={collapsed ? mod.label : ''}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: collapsed ? '10px 0' : '9px 1.25rem',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    background: 'transparent',
                    color: moduloAtivo ? 'var(--accent)' : 'var(--text3)',
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
                    border: 'none', cursor: 'pointer', transition: 'all .1s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{mod.icon}</span>
                    {!collapsed && <span>{mod.label}</span>}
                  </div>
                  {!collapsed && (
                    <span style={{ fontSize: 9, color: 'var(--text3)', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>▶</span>
                  )}
                </button>

                {(isOpen || collapsed) && mod.items.filter(i => !i.adminOnly || isAdmin).map((n, idx) => {
                  const ativo = isActive(n)
                  return (
                    <button
                      key={n.rhAba || n.key + idx}
                      onClick={() => {
                        setPage(n.key)
                        if (n.rhAba && setRhAba) setRhAba(n.rhAba)
                        if (!openModulos[mod.key]) setOpenModulos(prev => ({ ...prev, [mod.key]: true }))
                      }}
                      title={collapsed ? n.label : ''}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                        padding: collapsed ? '8px 0' : '7px 1.25rem 7px 2.5rem',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        background: ativo ? 'rgba(255,199,0,.08)' : 'transparent',
                        color: ativo ? 'var(--accent)' : 'var(--text2)',
                        borderLeft: ativo ? '2px solid var(--accent)' : '2px solid transparent',
                        fontSize: 13, fontWeight: ativo ? 500 : 400,
                        border: 'none', cursor: 'pointer', transition: 'all .1s',
                      }}
                      onMouseEnter={e => { if (!ativo) e.currentTarget.style.color = 'var(--text)' }}
                      onMouseLeave={e => { if (!ativo) e.currentTarget.style.color = 'var(--text2)' }}
                    >
                      <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
                      {!collapsed && <span>{n.label}</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div style={{
          padding: collapsed ? '.75rem .5rem' : '.75rem 1.25rem',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 9,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {profile?.nome?.charAt(0) || '?'}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.nome || 'Usuário'}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize' }}>{profile?.perfil}</div>
            </div>
          )}
          {!collapsed && <button onClick={logout} title="Sair" style={{ background: 'transparent', color: 'var(--text3)', fontSize: 14, padding: 2 }}>⏻</button>}
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
